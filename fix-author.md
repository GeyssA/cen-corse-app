# Changer l'auteur du dernier commit (arnau → GeyssA)

À exécuter dans le terminal, à la racine du projet.

## 1. Configurer ton identité Git (une fois)

Remplace par l’email utilisé sur **ton** compte GitHub (GeyssA) :

```bash
git config user.name "GeyssA"
git config user.email "TON-EMAIL-GITHUB@exemple.com"
```

## 2. Réécrire l’auteur du dernier commit

Cela modifie le dernier commit pour qu’il soit attribué à GeyssA :

```bash
git commit --amend --reset-author --no-edit
```

## 3. Envoyer la version corrigée sur GitHub

Comme l’historique est modifié, il faut un push forcé :

```bash
git push --force
```

⚠️ Utilise `--force` seulement sur une branche où tu es seul à pousser (ex. `main`). Si d’autres ont déjà tiré ce commit, préviens-les.

---

Après ça, le dernier commit sur GitHub affichera **GeyssA** (avec l’avatar/email de ton compte) au lieu d’arnau.
