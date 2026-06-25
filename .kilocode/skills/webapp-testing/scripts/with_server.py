#!/usr/bin/env python3
"""
Start one or more servers, wait for them to be ready, run a command, then clean up.

Usage:
    # Single server
    python scripts/with_server.py --server "npm run dev" --port 5173 -- automation
    python scripts/with_server.py --server "npm start" --port 3000 -- tests

    # Multiple servers
    python scripts/with_server.py \
      --server "cd backend && python server.py" --port 3000 \
      --server "cd frontend && npm run dev" --port 5173 \
      -- tests

Allowed commands: automation, tests
"""

import subprocess
import socket
import time
import sys
import argparse

# Allowlist of commands that can be executed after the servers are ready.
# The keys are short, user-supplied names; the values are the full command lists.
# Adjust this mapping as needed for your project.
ALLOWED_COMMANDS = {
    "automation": ["python", "automation.py"],
    "tests": ["python", "test.py"],
}


def is_server_ready(port, timeout=30):
    """Wait for server to be ready by polling the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(("localhost", port), timeout=1):
                return True
        except (socket.error, ConnectionRefusedError):
            time.sleep(0.5)
    return False


def main():
    parser = argparse.ArgumentParser(description="Run command with one or more servers")
    parser.add_argument(
        "--server",
        action="append",
        dest="servers",
        required=True,
        help="Server command (can be repeated)",
    )
    parser.add_argument(
        "--port",
        action="append",
        dest="ports",
        type=int,
        required=True,
        help="Port for each server (must match --server count)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Timeout in seconds per server (default: 30)",
    )
    parser.add_argument(
        "command", nargs=argparse.REMAINDER, help="Command to run after server(s) ready"
    )

    args = parser.parse_args()

    # Remove the '--' separator if present
    if args.command and args.command[0] == "--":
        args.command = args.command[1:]

    if not args.command:
        print("Error: No command specified to run")
        sys.exit(1)

    # Parse server configurations
    if len(args.servers) != len(args.ports):
        print("Error: Number of --server and --port arguments must match")
        sys.exit(1)

    servers = []
    for cmd, port in zip(args.servers, args.ports):
        servers.append({"cmd": cmd, "port": port})

    server_processes = []

    try:
        # Start all servers
        for i, server in enumerate(servers):
            print(f"Starting server {i + 1}/{len(servers)}: {server['cmd']}")

            # Use shell=True to support commands with cd and &&
            process = subprocess.Popen(
                server["cmd"],
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            server_processes.append(process)

            # Wait for this server to be ready
            print(f"Waiting for server on port {server['port']}...")
            if not is_server_ready(server["port"], timeout=args.timeout):
                raise RuntimeError(
                    f"Server failed to start on port {server['port']} within {args.timeout}s"
                )

            print(f"Server ready on port {server['port']}")

        print(f"\nAll {len(servers)} server(s) ready")

        # Run the command selected from the allowlist
        raw_args = [str(arg) for arg in args.command if arg]
        if not raw_args:
            print("Error: Invalid command", file=sys.stderr)
            sys.exit(1)

        command_key = raw_args[0]
        if command_key not in ALLOWED_COMMANDS:
            print(
                f"Error: Command '{command_key}' is not allowed. "
                f"Allowed commands are: {', '.join(sorted(ALLOWED_COMMANDS.keys()))}",
                file=sys.stderr,
            )
            sys.exit(1)

        # Only execute the predefined allowlisted command; do not pass through
        # arbitrary user-supplied arguments.
        if len(raw_args) > 1:
            print(
                f"Error: Extra arguments are not allowed for '{command_key}'",
                file=sys.stderr,
            )
            sys.exit(1)

        command = ALLOWED_COMMANDS[command_key]
        print(f"Running: {' '.join(command)}\n")
        result = subprocess.run(command, shell=False)
        sys.exit(result.returncode)

    finally:
        # Clean up all servers
        print(f"\nStopping {len(server_processes)} server(s)...")
        for i, process in enumerate(server_processes):
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            print(f"Server {i + 1} stopped")
        print("All servers stopped")


if __name__ == "__main__":
    main()
