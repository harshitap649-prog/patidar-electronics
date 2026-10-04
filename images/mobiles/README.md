# Mobile product photos

Drop one photo per product in this folder and it will be picked up automatically by
`mobiles.html` — no code change needed.

## File naming (the "slug")

`<brand>-<model>.png`, lowercase, every run of non-alphanumeric characters becomes a single `-`,
with leading/trailing `-` removed. Examples:

| addProduct(...) call                  | Expected file                              |
| ------------------------------------- | ------------------------------------------ |
| `addProduct("Nothing", "Phone (4a)")` | `nothing-phone-4a.png`                     |
| `addProduct("Oppo", "Reno 12 Pro 5G")`| `oppo-reno-12-pro-5g.png`                  |
| `addProduct("Realme", "P4X")`         | `realme-p4x.png`                           |

## Image tips

* Transparent PNG looks best; roughly 400x500 px (the card is 400x500, `object-fit: contain`).
* Any format the browser supports works (`.png`, `.webp`, `.jpg`, `.svg`).

## Per-product override

The automatic slug can be overridden per product with the optional 5th `image` argument of
`addProduct()` — it accepts a local path *or* a remote URL, and it wins over this folder:

```js
addProduct("Oppo", "F27 5G", [["8+128GB", 22999]], "", "images/mobiles/oppo-f27-5g-black.png");
addProduct("Oppo", "F27 5G", [["8+128GB", 22999]], "", "https://cdn.example.com/f27.png");
```

Resolution order per card: `product.image` -> `images/mobiles/<slug>.png`
-> generated branded card -> transparent phone outline.
