# Hammr — Project Overview

## What is Hammr?

Hammr is a **seller-listed auction marketplace**. This means sellers list their own products for auction, and buyers compete to win those products through **live bidding** — similar to how real-world online auction platforms work.

## Key Idea to Keep in Mind

This is **not** a simple listings page. Treat it as a **real-time system that involves money**. That means:

- Multiple buyers can try to bid on the **same item at the same time** (even within the same second).
- An auction's **closing time can change** depending on bidding activity near the end.
- Every bid the system accepts or rejects must be **100% correct and final** — no mistakes, no ambiguity.

## Tech Stack

| Layer | Required Technology |
|---|---|
| Frontend | Next.js with TypeScript |
| Backend | Node.js with TypeScript |
| Everything else (Database, ORM, caching, hosting, etc.) | Your choice — pick whatever tools make sense |

## User Roles

There are three types of users in Hammr:

1. **Seller** — Lists products for auction and tracks how those listings perform.
2. **Buyer** — Browses live auctions and places bids to try to win items.
3. **Platform Admin** *(optional)* — Has oversight across all sellers and buyers, only needed if you choose to build this role.

## Timeline

You have **3 days** from the time you receive this project brief to complete it.

## A Note on Using AI Tools

You're allowed and encouraged to use AI tools while working on this project — but only to:
- Learn concepts
- Get unstuck when you're stuck
- Review your own thinking/code

You should **not** use AI to generate the finished project for you. You need to be able to explain **any part of your code** and justify **why** you built it that way, if asked.