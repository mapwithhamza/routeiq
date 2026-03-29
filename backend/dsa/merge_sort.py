"""
backend/dsa/merge_sort.py — Merge Sort implementation (pure Python).

Sorts a list of delivery waypoints (or any comparable list) by a given key.

Big-O Complexity
----------------
Time:  O(n log n)  — all cases
Space: O(n)        — auxiliary array

Public API
----------
merge_sort(arr, key=None) -> list
    Returns a new sorted list; original list is unchanged.
"""

from typing import Callable, TypeVar

T = TypeVar("T")


def _merge(left: list, right: list, key: Callable) -> list:
    """Merge two sorted lists into one sorted list."""
    result: list = []
    i = j = 0
    while i < len(left) and j < len(right):
        if key(left[i]) <= key(right[j]):
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result


def merge_sort(arr: list, key: Callable = lambda x: x) -> list:
    """
    Return a new list sorted in ascending order by *key*.

    Parameters
    ----------
    arr : list       — input list (not mutated)
    key : callable   — key function (default: identity)

    Returns
    -------
    list — new sorted list

    Examples
    --------
    >>> merge_sort([3, 1, 4, 1, 5, 9])
    [1, 1, 3, 4, 5, 9]

    >>> waypoints = [{"priority": 2}, {"priority": 0}, {"priority": 1}]
    >>> merge_sort(waypoints, key=lambda w: w["priority"])
    [{'priority': 0}, {'priority': 1}, {'priority': 2}]
    """
    n = len(arr)
    if n <= 1:
        return list(arr)

    mid = n // 2
    left = merge_sort(arr[:mid], key=key)
    right = merge_sort(arr[mid:], key=key)
    return _merge(left, right, key)
