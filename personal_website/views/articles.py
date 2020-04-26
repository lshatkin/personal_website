import flask
from flask import Flask, render_template, request, url_for, redirect
import personal_website.config
import personal_website.model as model
import personal_website
import sys
import io

@personal_website.app.route('/articles/<title>')
def article(title):
    if title == "spotify_d3":
        print("d3", file = sys.stderr)
    articles = model.get_static_json("static/articles/articles.json")['articles']
    in_art = next((p for p in articles if p['link'] == title), None)

    if in_art is None:
        return render_template('404.html'), 404
    else:
        selected = in_art

    # # load html if the json file doesn't contain a description
    if 'description' not in selected:
        path = "articles"
        selected['description'] = io.open(model.get_static_file(
            'static/%s/%s/%s.html' % (path, selected['link'], selected['link'])), "r", encoding="utf-8").read()
    return render_template('article.html', project=selected)