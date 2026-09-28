import os
import json
import time
from typing import Optional, Dict, Any

CACHE_DIR = "data_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

class CacheService:
    def __init__(self, ttl_seconds: int = 86400):
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds

    def _get_file_path(self, key: str) -> str:
        safe_key = "".join(c if c.isalnum() else "_" for c in key)
        return os.path.join(CACHE_DIR, f"{safe_key}.json")

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        # 1. Check in-memory cache
        if key in self.memory_cache:
            item = self.memory_cache[key]
            if time.time() - item['timestamp'] < self.ttl:
                return item['data']
            else:
                del self.memory_cache[key]

        # 2. Check on-disk cache
        file_p = self._get_file_path(key)
        if os.path.exists(file_p):
            try:
                with open(file_p, 'r', encoding='utf-8') as f:
                    item = json.load(f)
                if time.time() - item['timestamp'] < self.ttl:
                    self.memory_cache[key] = item
                    return item['data']
            except Exception:
                pass
        return None

    def set(self, key: str, data: Dict[str, Any]):
        item = {'timestamp': time.time(), 'data': data}
        self.memory_cache[key] = item
        file_p = self._get_file_path(key)
        try:
            with open(file_p, 'w', encoding='utf-8') as f:
                json.dump(item, f, indent=2)
        except Exception as e:
            print(f"[CacheService] Disk write error: {e}")

cache_service = CacheService()
