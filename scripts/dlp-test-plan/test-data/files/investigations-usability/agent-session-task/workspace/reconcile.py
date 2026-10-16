"""Reconcile the customer export against the ledger.

Deliberately incomplete: the agent has to edit this file to finish the task.
"""
import csv
import sys


def load(path):
    with open(path) as fh:
        return list(csv.DictReader(fh))


def summarise(records):
    # TODO: return a dict with the record count and the number of distinct SSNs
    raise NotImplementedError


if __name__ == "__main__":
    records = load(sys.argv[1] if len(sys.argv) > 1 else "data/customers_export.csv")
    print(summarise(records))
