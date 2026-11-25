# @enikakis/kinship

> 🚧 Work in progress, not published yet. See [docs/PLAN.md](docs/PLAN.md).

Find how two people in a family tree are related, and name it in **Greek** or **English** (French,
German and Spanish experimental):

- the shortest chain of parents, children and marriages between them, preferring blood ties
- the relationship both ways, e.g. «θεία» / «ανιψιός», «πρώτος εξάδελφος του πατέρα»,
  "second cousin once removed", "3rd great-grandfather"
- the **other** ways they are related by blood (cousin marriages, siblings marrying siblings)
- the legal degree of kinship (Greek Civil Code, arts. 1463–1464)
- layout data for drawing the chain as a small tree

Zero runtime dependencies.

## Development

```sh
npm install
npm test
npm run typecheck
```

## License

MIT
