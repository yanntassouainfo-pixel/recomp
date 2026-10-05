import Link from 'next/link';

export const metadata = { title: 'Politique de confidentialité — RECOMP' };

export default function Confidentialite() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 space-y-6 text-[15px] leading-relaxed">
      <Link href="/" className="text-sm text-ink-2 hover:text-ink">← Retour</Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Politique de confidentialité</h1>
      <p className="text-ink-2">Dernière mise à jour : 5 octobre 2026. Version applicable à la démo publique de RECOMP (sans compte utilisateur).</p>
      <h2 className="font-bold text-xl">1. Responsable du traitement</h2>
      <p>[À compléter : nom ou raison sociale, adresse, e-mail de contact]. RECOMP est une application de coaching bien-être ; ce n’est pas un dispositif médical.</p>
      <h2 className="font-bold text-xl">2. Données traitées</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Profil : sexe, âge, taille, poids, niveau, disponibilité, préférences alimentaires, allergies, limitations déclarées, objectifs.</li>
        <li>Suivi : mensurations, check-ins quotidiens (énergie, sommeil, stress, humeur, faim, douleurs), séances et performances, repas, événements de vie.</li>
        <li>Photos corporelles, uniquement si tu en ajoutes.</li>
        <li>Conversations avec le coach.</li>
      </ul>
      <p>Certaines de ces données sont des données concernant la santé. Elles ne sont traitées qu’avec ton consentement explicite, demandé à l’onboarding et révocable dans le profil.</p>
      <h2 className="font-bold text-xl">3. Où sont stockées les données</h2>
      <p>Dans la version actuelle, toutes les données sont stockées <strong>dans ton navigateur</strong> (localStorage), en clair, sur l’appareil que tu utilises. Elles ne sont pas synchronisées, ne sont pas envoyées à un serveur et ne sont accessibles à personne d’autre que toi sur cet appareil. Utilise un appareil personnel. Sur la version en ligne hébergée par GitHub Pages, le stockage est partagé avec les autres sites du même compte GitHub : n’y mets pas de photos.</p>
      <h2 className="font-bold text-xl">4. Coach IA et sous-traitants</h2>
      <p>Lorsque l’application est déployée avec un fournisseur d’IA (Anthropic, OpenAI ou un service compatible), la question posée au coach et un résumé de ton profil et de tes 14 derniers jours (sans photos, sans drapeaux de santé) sont transmis à ce fournisseur pour générer la réponse. Sans fournisseur configuré, le coach répond localement et rien n’est transmis. [À compléter : fournisseur retenu, pays, garanties de transfert, absence d’entraînement sur tes données.]</p>
      <h2 className="font-bold text-xl">5. Durées de conservation</h2>
      <p>Les données restent dans ton navigateur tant que tu ne les supprimes pas (Profil → Supprimer toutes mes données) ou que tu ne vides pas le stockage du navigateur. Aucune copie n’est conservée ailleurs dans la version actuelle.</p>
      <h2 className="font-bold text-xl">6. Tes droits</h2>
      <p>Accès et portabilité : Profil → Exporter (JSON). Effacement : Profil → Supprimer toutes mes données. Retrait du consentement : cases dans le profil. Pour toute question ou réclamation : [e-mail de contact]. Tu peux aussi saisir la CNIL.</p>
      <h2 className="font-bold text-xl">7. Mineurs</h2>
      <p>RECOMP n’est pas destiné aux moins de 15 ans. Entre 15 et 18 ans, l’application reste en mode accompagnement général, sans déficit ni cibles agressives.</p>
      <h2 className="font-bold text-xl">8. Cookies et traceurs</h2>
      <p>Aucun cookie, aucun traceur, aucun outil d’analyse d’audience. Le seul stockage est celui décrit au point 3, plus ta préférence de thème.</p>
    </main>
  );
}
