"""Serve ÉCLAT on this computer and open its studio. Python 3 standard library."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    try:
        studio = ThreadingHTTPServer(("127.0.0.1", 8765), handler)
    except OSError:
        studio = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    with studio as server:
        url = f"http://127.0.0.1:{server.server_port}/index.html"
        print(f"ÉCLAT is open at {url}. Press Ctrl+C to close.")
        webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
