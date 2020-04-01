import io
import json
import os

import datetime
import time
from flask import Flask, render_template, request, url_for, redirect
import personal_website

try:
    app.config['GA_TRACKING_ID'] = os.environ['GA_TRACKING_ID']
except:
    print('Tracking ID not set')

resume_pdf_link = 'https://drive.google.com/open?id=0B2BrrDjIiyvmcWp5T194cy00UmM'


@personal_website.app.route('/')
def index():
    age = int((datetime.date.today() - datetime.date(1995, 4, 22)).days / 365)
    return render_template('home.html', age=age)


@personal_website.app.route('/timeline')
def timeline():
    return render_template('timeline.html', resume_pdf_link=resume_pdf_link)


@personal_website.app.route('/projects')
def projects():
    data = get_static_json("static/projects/projects.json")['projects']
    data.sort(key=order_projects_by_weight, reverse=True)

    tag = request.args.get('tags')
    if tag is not None:
        data = [project for project in data if tag.lower() in [project_tag.lower() for project_tag in project['tags']]]

    return render_template('projects.html', projects=data, tag=tag)


@personal_website.app.route('/articles')
def articles():
    data = get_static_json("static/articles/articles.json")['articles']
    data.sort(key=order_projects_by_weight, reverse=True)

    tag = request.args.get('tags')
    if tag is not None:
        data = [project for project in data if tag.lower() in [project_tag.lower() for project_tag in project['tags']]]

    return render_template('articles.html', projects=data, tag=tag)

@personal_website.app.route('/blog')
def blog():
    return redirect("http://bhardwajrish.blogspot.com/", code=302)


@personal_website.app.route('/experiences')
def experiences():
    books = get_static_json("static/experiences/experiences.json")['experiences']
    books.sort(key=order_projects_by_weight, reverse=True)
    return render_template('books.html', books=books, tag=None)


def order_projects_by_weight(projects):
    try:
        return int(projects['weight'])
    except KeyError:
        return 0


@personal_website.app.route('/projects/<title>')
def project(title):
    projects = get_static_json("static/projects/projects.json")['projects']
    experiences = get_static_json("static/experiences/experiences.json")['experiences']

    in_project = next((p for p in projects if p['link'] == title), None)
    in_exp = next((p for p in experiences if p['link'] == title), None)

    if in_project is None and in_exp is None:
        return render_template('404.html'), 404
    # fixme: choose the experience one for now, cuz I've done some shite hardcoding here.
    elif in_project is not None and in_exp is not None:
        selected = in_exp
    elif in_project is not None:
        selected = in_project
    else:
        selected = in_exp

    # load html if the json file doesn't contain a description
    if 'description' not in selected:
        path = "experiences" if in_exp is not None else "projects"
        selected['description'] = io.open(get_static_file(
            'static/%s/%s/%s.html' % (path, selected['link'], selected['link'])), "r", encoding="utf-8").read()
    return render_template('project.html', project=selected)

@personal_website.app.route('/articles/<title>')
def article(title):
    articles = get_static_json("static/articles/articles.json")['articles']

    in_art = next((p for p in articles if p['link'] == title), None)

    if in_art is None:
        return render_template('404.html'), 404
    else:
        selected = in_art

    # # load html if the json file doesn't contain a description
    if 'description' not in selected:
        path = "articles"
        selected['description'] = io.open(get_static_file(
            'static/%s/%s/%s.html' % (path, selected['link'], selected['link'])), "r", encoding="utf-8").read()
    return render_template('404.html'), 404


@personal_website.app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


def get_static_file(path):
    site_root = os.path.realpath(os.path.dirname(__file__))
    return os.path.join(site_root, path)


def get_static_json(path):
    return json.load(open(get_static_file(path)))


if __name__ == "__main__":
    print("running py app")
    app.run(host="127.0.0.1", port=5000, debug=True)
