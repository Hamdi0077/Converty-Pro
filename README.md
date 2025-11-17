# Converty-Pro
Plateforme E-commerce Multi-Boutiques (Type Shopify / Converty)
Converty-Pro est une plateforme e-commerce moderne permettant à n’importe quel utilisateur de créer sa propre boutique en ligne, gérer ses produits, suivre ses commandes et intégrer facilement des outils marketing comme Facebook Pixel, le tout en quelques clics.

Le projet est développé avec Next.js 14 (App Router) et Supabase, avec une architecture propre, scalable et performante.

🎯 Fonctionnalités Principales
🏬 Multi-Boutiques (Shopify-like)

Chaque utilisateur peut créer sa propre boutique personnalisée

URL dynamique : /shop/[slug]

Page boutique complète : bannière, description, catégories, recherche, filtrage…

🛍️ Gestion Avancée des Produits

CRUD complet (ajout, modification, suppression)

Upload d’images multiple (galerie + image principale)

Gestion du stock

Statut : publié / non publié

Catégories dynamiques

🖼️ Page Produit Professionnelle

Galerie d’images avec miniatures

Prix + prix barré

Stock dynamique

Description

CTA “Commander maintenant”

Retour à la boutique

💳 Checkout COD (Paiement à la Livraison)

Saisie des informations client

Enregistrement automatique des commandes

Génération d’items (order_items)

📦 Dashboard Complet (Admin)

Liste des produits

Liste des commandes

Settings de la boutique

Intégrations marketing (Pixel Facebook)

📈 Intégration Facebook Pixel (par boutique)

Chaque boutique possède SON propre Pixel Facebook pour optimiser les conversions :

Champ fb_pixel_id dans la table shops

Page dashboard “Settings → Integrations”

Tracking automatique :

PageView

ViewContent sur la page produit

Purchase (lors du checkout COD)

🛠️ Stack Technique

Next.js 14 (App Router)

Supabase

Auth

Database (PostgreSQL)

RLS sécurisée

Storage (images produits)

TailwindCSS

TypeScript

shadcn/ui

Docker ready

📦 Ready for Production (Docker)

Le projet inclut un Dockerfile et un docker-compose permettant un déploiement propre :

docker-compose build
docker-compose up -d

🔐 Sécurité

RLS activée sur toutes les tables sensibles

Accès produit limité à la boutique propriétaire

Suppression en cascade (product_images, order_items)

🎨 UI / UX

Thème boutique professionnel (type Shopify/Converty)

Hero section

Carte boutique

Grille produits responsive

Effets hover / transitions

Interface admin moderne & simple

📈 Roadmap

Ajout du panier (Add to Cart)

Système de variantes (taille / couleur)

Sous-domaines dynamiques (boutique.mondomaine.com)

Thèmes personnalisables

Pages SEO : Home, About, Contact

❤️ Contribute

Les PR sont les bienvenues !
Projet open-source destiné à aider les entrepreneurs et développeurs à lancer leur propre plateforme e-commerce moderne.

✔ Exemple de commit message
feat: add facebook pixel integration per shop + dynamic tracking
