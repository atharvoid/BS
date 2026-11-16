"""Serve the optional authoring build with its comparison as the landing page.
Build with --mode posters --outDir .poster-build first, then run this script.
Prototype image captures and HTML are copied separately; never production assets.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

root = Path(__file__).resolve().parents[1]
os.chdir(root / '.poster-build')


class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] == '/':
            self.send_response(302)
            self.send_header('Location', '/iterations.html')
            self.end_headers()
            return
        super().do_GET()


ThreadingHTTPServer(('0.0.0.0', 4182), Preview).serve_forever()
