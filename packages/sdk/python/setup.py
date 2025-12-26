#!/usr/bin/env python3

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="docusign-alternative-sdk",
    version="1.0.0",
    author="DocuSign Alternative Team",
    author_email="support@docusign-alternative.com",
    description="Official Python SDK for DocuSign Alternative e-signature platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/docusign-alternative/sdk",
    project_urls={
        "Bug Tracker": "https://github.com/docusign-alternative/sdk/issues",
        "Documentation": "https://docs.docusign-alternative.com/sdk/python",
        "Source Code": "https://github.com/docusign-alternative/sdk/tree/main/python",
    },
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Office/Business",
        "Topic :: Security :: Cryptography",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "sphinx>=6.0.0",
            "sphinx-rtd-theme>=1.2.0",
        ],
        "async": [
            "aiohttp>=3.8.0",
            "aiofiles>=23.0.0",
        ],
    },
    keywords=[
        "docusign-alternative",
        "e-signature",
        "digital-signature",
        "pdf",
        "api-client",
        "document-signing",
        "electronic-signature",
    ],
    include_package_data=True,
    zip_safe=False,
)