# 03 — Design system « Still Motion »

Direction : **Premium Health Tech**. Performance + sérénité + transformation. Lisibilité et vitesse avant l'effet.

## Principes
1. Le chiffre le plus gros d'un écran est toujours une **tendance** ou un **score**, jamais le poids brut.
2. Verre (glass) uniquement sur les surfaces flottantes (nav, modales, toasts). Les cartes de données sont opaques.
3. Un accent de couleur par **domaine**, cohérent partout : Body (indigo), Muscle (corail), Fat/Composition (teal), Vitality (menthe), Recovery (ambre), Consistency (or), Nutrition (olive).
4. Mouvement doux : 200–350 ms, easing `cubic-bezier(.2,.8,.2,1)`, jamais de rebond.

## Tokens (CSS variables, light + dark)

```
--bg            #F5F4F0 / #0E1012      fond « os » chaud / nuit
--surface       #FFFFFF / #16191D      cartes
--surface-2     #EFEEE9 / #1D2126      cartes secondaires, inputs
--ink           #121417 / #F2F2EE      texte principal
--ink-2         #5B6168 / #A0A6AD      texte secondaire
--line          #E4E2DB / #262B31      bordures
--accent-body        #5B5FEF
--accent-muscle      #F06A4D
--accent-fat         #15A39A
--accent-vitality    #38C98E
--accent-recovery    #F0A93B
--accent-consistency #D4A72C
--accent-nutrition   #7A9B3A
--danger             #D9453B
--radius-card  24px   --radius-ctl 14px   --radius-pill 999px
--shadow-1  0 1px 2px rgba(18,20,23,.04), 0 8px 24px -12px rgba(18,20,23,.12)
```

## Typographie
- **Titres / chiffres** : Manrope 600–800, chiffres tabulaires (`font-variant-numeric: tabular-nums`).
- **Texte** : Manrope 400–500, 15–16 px, interlignage 1.5.
- Échelle : 12 / 13 / 15 / 17 / 20 / 24 / 32 / 44 / 56.

## Espacements
4-pt grid : 4, 8, 12, 16, 20, 24, 32, 40, 56. Cartes : padding 20 (mobile) / 24 (desktop). Grille bento : 12 colonnes desktop, 2 colonnes mobile, gap 16.

## Composants
Button (primary / secondary / ghost / danger), Card (bento, header + métrique + sparkline), ScoreRing, TrendBadge (↑↓→ avec interprétation), EvidenceBadge (Solide / Probable / Incertain / Approche), WhyButton (popover explicatif), Slider check-in (1–5), Segmented control, Tabs, Modal/Sheet, Toast, Progress bar, PlateDiagram (assiette), BeforeAfterSlider, Nav (sidebar desktop, barre basse mobile, verre).

## États et ton
- Vide : phrase utile + action unique.
- Erreur : jamais rouge plein écran ; bandeau discret.
- Succès : confirmation sobre ; pas d'emoji dans les messages système.
