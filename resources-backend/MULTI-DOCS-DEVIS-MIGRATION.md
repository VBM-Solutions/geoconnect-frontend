# Migration : documents multiples sur une demande de devis

> **Contexte** : `docsDevis` est passé d'un document unique à une liste.  
> Ce document liste toutes les adaptations à réaliser côté front.

---

## 🔄 Ce qui a changé côté backend

### `POST /demandeDevis` et `PUT /demandeDevis`

Le champ `docsDevisId` (un seul `Long`) **est remplacé** par `docsDevisIds` (un tableau de `Long`).

**Avant :**
```json
{
  "type": "G1_ELAN",
  "adresseProjet": { ... },
  "clientId": 1,
  "docsDevisId": 42
}
```

**Après :**
```json
{
  "type": "G1_ELAN",
  "adresseProjet": { ... },
  "clientId": 1,
  "docsDevisIds": [42, 57]
}
```

> ℹ️ Si aucun document n'est joint, omettre le champ ou envoyer `"docsDevisIds": []`.

---

### `GET /demandeDevis/{id}` et `GET /demandeDevis/client/{clientId}`

La réponse ne contient plus `docsDevisId` mais `docsDevisIds`.

**Avant :**
```json
{
  "id": 10,
  "docsDevisId": 42,
  ...
}
```

**Après :**
```json
{
  "id": 10,
  "docsDevisIds": [42, 57],
  ...
}
```

---

### `GET /etude/{id}/detail`

Même changement dans le sous-objet `propositionDevis.demandeDevis` :

**Avant :**
```json
{
  "propositionDevis": {
    "demandeDevis": {
      "docsDevisId": 42
    }
  }
}
```

**Après :**
```json
{
  "propositionDevis": {
    "demandeDevis": {
      "docsDevisIds": [42, 57]
    }
  }
}
```

---

### Renommage de la valeur d'enum `TypeDocumentEnum`

La valeur `DEVIS_DEVIS` a été renommée en **`DOCS_CLIENT`** (= documents joints par le client à sa demande de devis).

Ce changement impacte le **nom de fichier généré** lors d'un téléchargement (`GET /documents/{id}/download`) : le backend construit le nom selon le pattern `NOM_PRENOM-TYPE_MISSION-TYPE_DOCUMENT.ext`.

| Avant | Après |
|---|---|
| `MARTIN_JEAN-G1_ELAN-DEVIS_DEVIS.pdf` | `MARTIN_JEAN-G1_ELAN-DOCS_CLIENT.pdf` |

> ℹ️ Si le front affiche ou utilise la valeur de l'enum (ex. label lisible, filtre, icône), remplacer `DEVIS_DEVIS` par `DOCS_CLIENT` dans le code front et les éventuelles traductions.

---

## 🖥️ Adaptations à réaliser côté front

### 1. Formulaire de création d'une demande de devis (`/client/new-request`)

| Avant | Après |
|---|---|
| Un seul input de type fichier | Plusieurs fichiers (input `multiple` ou ajout/suppression dynamique) |
| Upload → 1 seul `POST /documents/upload` → 1 `id` | Upload → N × `POST /documents/upload` → tableau d'`id` |
| Envoyer `docsDevisId: id` dans le body | Envoyer `docsDevisIds: [id1, id2, ...]` dans le body |

**Flow mis à jour :**
```
[Formulaire] → (optionnel) N × POST /documents/upload  → [id1, id2, ...]
             → POST /demandeDevis  { ..., docsDevisIds: [id1, id2, ...] }
             → Redirection Dashboard
```

**Exemple de gestion des uploads multiples :**
```js
// Uploader tous les fichiers sélectionnés séquentiellement
const docsDevisIds = [];
for (const file of selectedFiles) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axios.post('/documents/upload', formData);
  docsDevisIds.push(data.id);
}

await axios.post('/demandeDevis', {
  ...formFields,
  docsDevisIds,
});
```

---

### 2. Affichage des documents joints sur une demande

Partout où le front affiche le(s) document(s) joint(s) à une demande de devis, remplacer la logique scalaire par une itération sur la liste.

**Avant :**
```jsx
{demande.docsDevisId && (
  <a href={`/documents/${demande.docsDevisId}/download`}>
    Voir le document joint
  </a>
)}
```

**Après :**
```jsx
{demande.docsDevisIds?.map((docId) => (
  <a key={docId} href={`/documents/${docId}/download`} target="_blank">
    Document joint #{docId}
  </a>
))}
```

> ℹ️ Penser à gérer le cas où `docsDevisIds` est `null` ou vide (`?.` ou guard explicite).

---

### 3. Affichage dans le détail d'une étude (`/client/etude/:id`, `/be/etude/:id`)

Le champ `propositionDevis.demandeDevis.docsDevisId` n'existe plus — utiliser `docsDevisIds` à la place, avec la même logique d'itération que ci-dessus.

---

### 4. Types TypeScript (si applicable)

Mettre à jour les interfaces/types :

```ts
// Avant
interface DemandeDevisDTO {
  docsDevisId?: number;
  // ...
}

// Après
interface DemandeDevisDTO {
  docsDevisIds?: number[];
  // ...
}
```

Idem dans `EtudeDetailDTO.DemandeDevisDetail` si vous avez des types dédiés à la réponse du détail d'étude.

---

## ✅ Checklist de migration front

- [ ] Input fichier → passer en mode **multiple** sur le formulaire de création de demande
- [ ] Upload → collecter tous les `id` retournés dans un tableau
- [ ] Body `POST /demandeDevis` → remplacer `docsDevisId` par `docsDevisIds: [...]`
- [ ] Body `PUT /demandeDevis` (si utilisé) → même remplacement
- [ ] Affichage document joint sur la liste des demandes → itérer sur `docsDevisIds`
- [ ] Affichage document joint sur le détail d'une demande → itérer sur `docsDevisIds`
- [ ] Affichage dans le détail étude → `docsDevisIds` au lieu de `docsDevisId`
- [ ] Mise à jour des types TypeScript
- [ ] Remplacer `DEVIS_DEVIS` par `DOCS_CLIENT` dans les labels, traductions ou filtres front
- [ ] Tester qu'une demande sans document fonctionne toujours (tableau vide ou champ absent)

