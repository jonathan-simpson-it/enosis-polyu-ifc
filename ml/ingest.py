"""Entry: init db -> normalize -> pair features."""
from db import init_db
import normalize
import features

if __name__ == "__main__":
    init_db()
    normalize.run()
    features.run()
    print("ingest complete")