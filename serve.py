#!/usr/bin/env python3
"""Zero-dependency local preview server for the TeachSack site.

Usage:
    python serve.py [port]

Then open the printed http://localhost:<port>/ URL in your browser.
Serving over http (instead of opening index.html via file://) lets the
native WebGL dynamic background render correctly. Stdlib only, no install.
"""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Disable caching so edits show up immediately on refresh.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving: {ROOT}")
        print(f"Open  ->  http://localhost:{PORT}/")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
