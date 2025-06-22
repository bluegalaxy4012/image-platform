import os
import requests
import time
import dotenv

dotenv.load_dotenv()
API_URL = os.getenv("API_URL")

def test_upload_invalid_file():
    response = requests.post(
        f"{API_URL}/upload/",
        files={"file": ("invalid_file.txt", "This is not a image", "image/jpeg")},
        data={"filter": "grayscale"}
     )
    assert response.status_code == 400
    print("Test for invalid file passed.")

def test_upload_large_file():
    response = requests.post(
        f"{API_URL}/upload/",
        files={"file": ("file.jpg", b"x" * (10**7), "image/jpeg")},
        data={"filter": "sepia"}
    )

    assert response.status_code == 400
    print("Test for large file passed.")

def test_get_missing_file():
    response = requests.get(f"{API_URL}/images/missing_id/")
    assert response.status_code == 404
    print("Test for missing file passed.")


def test_upload_valid_file():
    with open("test_image.jpg", "rb") as img:
        response = requests.post(
            f"{API_URL}/upload/",
            files={"file": ("test_image.jpg", img, "image/jpeg")},
            data={"filter": "grayscale"}
        )

    assert response.status_code == 200
    print("Test for valid file upload passed.")


def test_get_valid_file():
    # we are sure that the file with id 'testid' exists
    response = requests.get(f"{API_URL}/images/testid/")
    assert response.status_code == 200
    print("Test for valid file retrieval passed.")



