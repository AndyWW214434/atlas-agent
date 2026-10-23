"""Saved logins, encrypted at rest.

The encryption key lives in the OS keychain (macOS Keychain), falling back to a 0600 key file next to the vault.
Secrets only leave this module to be typed into a page by the browser; the list function never returns them,
and nothing here is sent to the model or written to a task's history.
"""

import json
import os
import re
import uuid
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

from .tools import ToolError

DATA = Path(os.environ.get("ATLAS_DATA") or Path(__file__).resolve().parent.parent / "data")
VAULT_FILE = DATA / "vault.json"
KEY_FILE = DATA / ".vault.key"
SERVICE, ACCOUNT = "atlas-agent", "vault-key"


def _key() -> bytes:
    try:
        import keyring

        key = keyring.get_password(SERVICE, ACCOUNT)
        if not key:
            key = Fernet.generate_key().decode()
            keyring.set_password(SERVICE, ACCOUNT, key)
        return key.encode()
    except Exception:
        DATA.mkdir(parents=True, exist_ok=True)
        if not KEY_FILE.exists():
            fd = os.open(KEY_FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "wb") as f:
                f.write(Fernet.generate_key())
        return KEY_FILE.read_bytes()


def _read() -> list[dict]:
    try:
        return json.loads(VAULT_FILE.read_text())
    except (OSError, ValueError):
        return []


def _write(entries: list[dict]):
    DATA.mkdir(parents=True, exist_ok=True)
    tmp = VAULT_FILE.with_suffix(".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(entries, f)
    tmp.replace(VAULT_FILE)


def slug(label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", label.strip().lower()).strip("-")[:40]


def save(label: str, username: str, password: str) -> str:
    label = label.strip()[:60]
    if not slug(label) or not username or not password:
        raise ValueError("Name, username and password are all required.")
    secret = Fernet(_key()).encrypt(json.dumps({"username": username, "password": password}).encode()).decode()
    entries = [e for e in _read() if slug(e["label"]) != slug(label)]
    entries.append({"id": uuid.uuid4().hex[:10], "label": label, "secret": secret})
    _write(entries)
    return label


def labels() -> list[str]:
    return [e["label"] for e in _read()]


def listing() -> list[dict]:
    """For the UI: names only, never the secret. The username is shown so you can tell entries apart."""
    out = []
    f = Fernet(_key())
    for e in _read():
        try:
            username = json.loads(f.decrypt(e["secret"].encode()))["username"]
        except (InvalidToken, KeyError, ValueError):
            username = "(unreadable)"
        out.append({"id": e["id"], "label": e["label"], "username": username})
    return out


def get(label: str) -> dict:
    """Used only by the browser to fill a sign-in form."""
    wanted = slug(label or "")
    for e in _read():
        if slug(e["label"]) == wanted:
            try:
                return json.loads(Fernet(_key()).decrypt(e["secret"].encode()))
            except (InvalidToken, ValueError):
                raise ToolError(f"The saved login '{e['label']}' could not be decrypted. Ask the user to save it again.")
    have = ", ".join(labels()) or "none yet"
    raise ToolError(f"No saved login named '{label}'. Saved logins: {have}.")


def delete(entry_id: str) -> bool:
    entries = _read()
    kept = [e for e in entries if e["id"] != entry_id]
    _write(kept)
    return len(kept) != len(entries)


def seal(value: str) -> str:
    """Encrypt a single secret (e.g. a connector's access token) with the vault key."""
    return Fernet(_key()).encrypt(value.encode()).decode()


def unseal(value: str) -> str:
    return Fernet(_key()).decrypt(value.encode()).decode()
