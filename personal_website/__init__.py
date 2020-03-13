"""
Insta485 package initializer.
"""
import flask

# app is a single object used by all the code modules in this package
app = flask.Flask(__name__)  # pylint: disable=invalid-name

# Read settings from config module (insta485/config.py)
app.config.from_object('personal_website.config')

import personal_website.model  # noqa: E402  pylint: disable=wrong-import-position

