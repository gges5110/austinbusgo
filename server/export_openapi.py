"""Print the app's OpenAPI schema as JSON.

Used by the client's `npm run generate` to produce client/openapi.json,
which orval turns into typed react-query hooks.
"""

import json

from server.main import create_app

if __name__ == "__main__":
    print(json.dumps(create_app().openapi(), indent=2))
