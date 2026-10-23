"""Client-side tools the agent can call. Every path is confined to the task workspace."""

import asyncio
import base64
from pathlib import Path

MAX_OUTPUT = 20_000


def truncate(text: str, limit: int = MAX_OUTPUT) -> str:
    if len(text) <= limit:
        return text
    half = limit // 2
    return f"{text[:half]}\n\n... [{len(text) - limit} characters truncated] ...\n\n{text[-half:]}"


def resolve(workspace: Path, path: str) -> Path:
    target = (workspace / path).resolve()
    if not target.is_relative_to(workspace.resolve()):
        raise ToolError(f"Path '{path}' is outside the workspace.")
    return target


class ToolError(Exception):
    pass


# ---------------------------------------------------------------------------
# Tool schemas (sent to the API)
# ---------------------------------------------------------------------------

def _tool(name, description, properties, required):
    return {
        "name": name,
        "description": description,
        "eager_input_streaming": True,
        "input_schema": {
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": False,
        },
    }


PLAN_TOOL = _tool(
    "update_plan",
    "Create or update the task plan shown to the user. Call this at the start of any multi-step task "
    "with 3-7 concise phases, and again whenever a phase completes or the plan changes. "
    "Exactly one step should be 'in_progress' while you work.",
    {
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short imperative phrase"},
                    "status": {"type": "string", "enum": ["pending", "in_progress", "done"]},
                },
                "required": ["title", "status"],
                "additionalProperties": False,
            },
        }
    },
    ["steps"],
)

SHELL_TOOL = _tool(
    "shell",
    "Run a bash command in the task workspace (the current directory). Use it to run scripts, install "
    "packages (pip install --user / npm), inspect files, convert documents, etc. Commands are non-interactive.",
    {
        "command": {"type": "string"},
        "timeout": {"type": "integer", "description": "Seconds before the command is killed (default 120, max 600)"},
    },
    ["command"],
)

WRITE_TOOL = _tool(
    "write_file",
    "Create or overwrite a text file in the workspace. Use it for deliverables (reports, code, HTML, CSV, markdown).",
    {"path": {"type": "string", "description": "Path relative to the workspace"}, "content": {"type": "string"}},
    ["path", "content"],
)

READ_TOOL = _tool(
    "read_file",
    "Read a text file from the workspace, optionally a line range.",
    {
        "path": {"type": "string"},
        "start_line": {"type": "integer"},
        "end_line": {"type": "integer"},
    },
    ["path"],
)

EDIT_TOOL = _tool(
    "edit_file",
    "Replace exactly one occurrence of old_str with new_str in a workspace file.",
    {"path": {"type": "string"}, "old_str": {"type": "string"}, "new_str": {"type": "string"}},
    ["path", "old_str", "new_str"],
)

BROWSER_TOOL = _tool(
    "browser",
    "Operate a real Chrome browser (1280x800) in your own isolated browser session: it keeps tabs, cookies and "
    "logins between calls and downloads files into the workspace's downloads/ folder. Workflow: navigate, then "
    "'snapshot' to get a screenshot with numbered boxes over every clickable or typeable element plus a text list "
    "of them; then click/type/select by that index (far more reliable than coordinates). Elements are only valid "
    "for the latest snapshot, so snapshot again after the page changes. Use 'read' for the page's full text, "
    "'eval' to run JavaScript, 'upload' to attach a workspace file to a file input, and 'login' to sign in with a saved "
    "login (on a sign-in page; it fills the username and password and presses Enter, handling two-step sign-ins; you "
    "never see the password). Use it for pages that need "
    "interaction, logins or JavaScript, and to visually check HTML you built (navigate to file://<absolute path>). "
    "Actions run strictly in order, but element numbers go stale after any click, navigation or scroll, so only "
    "batch several type/select/click calls in one turn when they stay on the same page, and snapshot again after. "
    "For simply reading a public page prefer web_fetch.",
    {
        "action": {"type": "string", "enum": [
            "navigate", "snapshot", "click", "type", "press", "scroll", "select", "hover", "back", "forward",
            "reload", "read", "eval", "wait", "screenshot", "new_tab", "switch_tab", "close_tab", "upload", "find", "login"]},
        "url": {"type": "string", "description": "For navigate / new_tab"},
        "index": {"type": "integer", "description": "Element number from the latest snapshot (click, type, select, hover, upload)"},
        "x": {"type": "integer", "description": "Pixel x for click/hover when no index"},
        "y": {"type": "integer", "description": "Pixel y for click/hover when no index"},
        "text": {"type": "string", "description": "For type; or the text to look for with find"},
        "submit": {"type": "boolean", "description": "For type: press Enter afterwards"},
        "key": {"type": "string", "description": "For press, e.g. Enter, Tab, Escape, PageDown, Control+a"},
        "direction": {"type": "string", "enum": ["up", "down"], "description": "For scroll"},
        "amount": {"type": "integer", "description": "Pixels to scroll (default 600)"},
        "value": {"type": "string", "description": "Option value or label for select"},
        "script": {"type": "string", "description": "JavaScript expression or function body for eval; its return value is shown"},
        "seconds": {"type": "integer", "description": "For wait (max 30)"},
        "tab": {"type": "integer", "description": "Tab number for switch_tab / close_tab"},
        "path": {"type": "string", "description": "Workspace file to upload"},
        "credential": {"type": "string", "description": "For login: the name of a saved login"},
    },
    ["action"],
)

ASK_TOOL = _tool(
    "ask_user",
    "Pause the task and ask the user, then wait for their answer. Two kinds. kind='confirm': get approval BEFORE any "
    "irreversible or outward-facing action (sending a message, moving or deleting emails, buying, submitting a form "
    "with consequences) - describe exactly what you will do, with a short list of what is affected. "
    "kind='credentials': show the user a secure form for a username and password. It is stored encrypted on their "
    "computer and you never see it; afterwards sign in with the browser tool's 'login' action. Prefer this for sites "
    "they use repeatedly. kind='handoff': hand the live browser to the user so they can do something only they "
    "should do, such as 2-step verification, a CAPTCHA, or logging in themselves. After a handoff, take a snapshot to "
    "see where the page is. Never ask the user to type a password or secret into chat.",
    {
        "message": {"type": "string", "description": "What you need, in one or two plain sentences, plus details for confirm"},
        "kind": {"type": "string", "enum": ["confirm", "handoff", "credentials"]},
        "label": {"type": "string", "description": "For credentials: a short name for the login, e.g. 'Gmail'"},
    },
    ["message", "kind"],
)

SCHEMA_TYPES = {"string": str, "integer": int, "boolean": bool, "array": list, "object": dict}


def validate(tool: dict, args) -> str | None:
    """With eager input streaming the API does not validate inputs, so check them here."""
    schema = tool["input_schema"]
    if not isinstance(args, dict):
        return "Input must be a JSON object."
    for key in schema["required"]:
        if key not in args:
            return f"Missing required field '{key}'."
    for key, value in args.items():
        spec = schema["properties"].get(key)
        if spec is None:
            return f"Unknown field '{key}'."
        expected = SCHEMA_TYPES.get(spec["type"])
        if expected and not isinstance(value, expected):
            return f"Field '{key}' must be of type {spec['type']}."
        if "enum" in spec and value not in spec["enum"]:
            return f"Field '{key}' must be one of {spec['enum']}."
    return None


# ---------------------------------------------------------------------------
# Implementations
# ---------------------------------------------------------------------------

async def run_shell(workspace: Path, command: str, timeout: int | None, on_output) -> str:
    timeout = max(1, min(timeout or 120, 600))
    proc = await asyncio.create_subprocess_shell(
        command,
        cwd=workspace,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        stdin=asyncio.subprocess.DEVNULL,
        executable="/bin/bash",
        start_new_session=True,
    )
    chunks: list[str] = []

    async def pump():
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            text = line.decode(errors="replace")
            chunks.append(text)
            await on_output(text)

    try:
        await asyncio.wait_for(pump(), timeout)
        code = await proc.wait()
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        chunks.append(f"\n[command timed out after {timeout}s]")
        code = -1
    except asyncio.CancelledError:
        proc.kill()
        raise
    output = truncate("".join(chunks)) or "(no output)"
    return f"{output}\n[exit code {code}]"


def write_file(workspace: Path, path: str, content: str) -> str:
    target = resolve(workspace, path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    return f"Wrote {len(content)} characters to {target.relative_to(workspace.resolve())}"


def read_file(workspace: Path, path: str, start_line=None, end_line=None) -> str:
    target = resolve(workspace, path)
    if not target.is_file():
        raise ToolError(f"File '{path}' does not exist.")
    lines = target.read_text(errors="replace").splitlines()
    start = max(1, start_line or 1)
    end = min(len(lines), end_line or len(lines))
    numbered = "\n".join(f"{i:>5}  {lines[i - 1]}" for i in range(start, end + 1))
    return truncate(numbered) or "(empty file)"


def edit_file(workspace: Path, path: str, old_str: str, new_str: str) -> str:
    target = resolve(workspace, path)
    if not target.is_file():
        raise ToolError(f"File '{path}' does not exist.")
    text = target.read_text()
    count = text.count(old_str)
    if count != 1:
        raise ToolError(f"old_str must match exactly once; found {count} matches.")
    target.write_text(text.replace(old_str, new_str, 1))
    return f"Edited {path}"


def image_block(data: bytes) -> dict:
    return {
        "type": "image",
        "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.standard_b64encode(data).decode()},
    }
