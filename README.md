# Helia monorepo

## Stop — read this first

We run a **4-agent product loop** before treating the consumer app as V1:

**User → Product Manager → Coder → QA → (repeat until all approve)**

See [`product-loop/README.md`](./product-loop/README.md).

The mobile Helia UI in this repo is a **prototype**. App creation / V1 ship is authorized only when `product-loop/workspace/v1-status.json` has `"gate_open": true`.

## Prototype (not V1-final)

```bash
npm install
npm run dev
```

## Product loop (authoritative process)

```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"  # Node 24+
cd product-loop && npm install && npm run dev
```
