#!/bin/bash
# Direct database extracts - reproduce the CLI extraction on your own box, so the PROCESS is real.
# The .txt alongside this script is what the command below produces.

psql -h prod-replica.internal.example.com -U reporting -d billing \
  -c "SELECT customer_id, first_name, last_name, ssn, email,
             routing_number, account_number
        FROM customers.customer_payment_profile
       WHERE active = true
       ORDER BY customer_id LIMIT 300" \
  > ~/Desktop/extract.txt

# The point of this row is process attribution. A file dropped on the Desktop by hand
# is not the same event as one written by psql, and CLI extraction is exactly where
# most tools lose sight of the data.
