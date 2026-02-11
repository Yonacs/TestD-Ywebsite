# D&Y IMMO

Webapp mobile-first pour extraire automatiquement les infos d'annonces immobilières.

## Comment DOXE/Codex ouvre un site (la méthode fiable)

Quand on construit une app ici, le flux standard est:

1. **Le serveur tourne** (`npm start`)
2. **Le site s'ouvre sur** `http://localhost:3000`
3. Si on veut un lien internet, on passe par un tunnel (temporaire)

> Le lien StackBlitz peut ne pas marcher si le repo n'est pas accessible publiquement ou si StackBlitz bloque la session.

---

## Chemin A (recommandé) — lancer localement en 1 commande

Copie-colle **exactement** cette ligne:

```bash
cd ~ && rm -rf TestD-Ywebsite && git clone https://github.com/Yonacs/TestD-Ywebsite.git && cd TestD-Ywebsite && npm install && npm start
```

Puis ouvre dans Chrome:

```text
http://localhost:3000
```

---

## Chemin B — vérification rapide si ça ne démarre pas

Dans le terminal, exécute:

```bash
cd ~/TestD-Ywebsite
pwd
ls
npm run
```

Tu dois voir:
- le dossier courant finit par `TestD-Ywebsite`
- `package.json`, `server.js`, `public/`
- un script `start` dans la sortie de `npm run`

Ensuite:

```bash
npm start
```

---

## Chemin C — lien internet temporaire (sans config serveur)

Si tu veux partager l'app avec quelqu'un:

```bash
cd ~/TestD-Ywebsite
npm start
```

Dans un 2e terminal:

```bash
npx localtunnel --port 3000
```

Tu obtiens une URL `https://xxxx.loca.lt` (temporaire).

---

## Pourquoi tu as eu `npm error Missing script: "start"`

Cette erreur signifie presque toujours: **tu n'étais pas dans le bon dossier** au moment de lancer `npm start`.

Vérifie:

```bash
pwd
cat package.json
```

Le fichier doit contenir:

```json
"scripts": {
  "start": "node server.js"
}
```

---

## Pièges copier-coller à éviter absolument

- Ne pas mettre `<` `>` autour des commandes
- Ne pas mettre `[` `]`
- Ne pas taper le prompt (`bash-3.2$` ou `%`)

✅ Correct:

```bash
git clone https://github.com/Yonacs/TestD-Ywebsite.git
cd TestD-Ywebsite
npm start
```

❌ Incorrect:

```bash
git clone <https://github.com/Yonacs/TestD-Ywebsite.git>
[cd TestD-Ywebsite]
bash-3.2$ npm start
```
