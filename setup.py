"""
fantasyreport python package configuration.

"""

from setuptools import setup

setup(
    name='personal_website',
    version='0.1.0',
    packages=['personal_website'],
    include_package_data=True,
    install_requires=[
        'blinker==1.4',
        'click==6.7',
        'Flask==1.0.0',
        'Flask-HTTPAuth==3.2.3',
        'Flask-Mail==0.9.1',
        'Flask-SQLAlchemy==2.3.2',
        'Flask-WTF==0.14.2',
        'gunicorn==19.7.1',
        'itsdangerous==0.24',
        'Jinja2==2.10.1',
        'MarkupSafe==1.0',
        'SQLAlchemy==1.3.0',
        'Werkzeug==0.16.0',
        'WTForms==2.1'
    ],
)
