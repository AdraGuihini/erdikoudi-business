<?php
// 1. LES AUTORISATIONS (CORS)
// Ces lignes permettent à ton projet React de discuter avec PHP sans blocage de sécurité
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// 2. CONFIGURATION DE LA BASE DE DONNÉES
$serveur = "localhost";
$utilisateur = "root";
$mot_de_passe = ""; // Par défaut vide sur Wamp
$base_de_donnees = "erdikoudi_db";

// 3. CONNEXION À MYSQL
$conn = new mysqli($serveur, $utilisateur, $mot_de_passe, $base_de_donnees);

// Vérifier si la connexion fonctionne
if ($conn->connect_error) {
    die(json_encode(["erreur" => "La connexion a échoué: " . $conn->connect_error]));
}

// 4. RÉCUPÉRER LES COMMENTAIRES (Quand on ouvre la page)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM commentaires ORDER BY date_publication DESC";
    $resultat = $conn->query($sql);
    $commentaires = [];
    
    while($row = $resultat->fetch_assoc()) {
        $commentaires[] = $row;
    }
    echo json_encode($commentaires);
}

// 5. ENREGISTRER UN NOUVEAU COMMENTAIRE (Quand on clique sur Publier)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // On récupère les données envoyées par React
    $donnees = json_decode(file_get_contents("php://input"), true);
    
    $nom = $conn->real_escape_string($donnees['nom']);
    $message = $conn->real_escape_string($donnees['message']);
    $etoiles = $conn->real_escape_string($donnees['etoiles']);
    
    $sql = "INSERT INTO commentaires (nom, message, etoiles) VALUES ('$nom', '$message', '$etoiles')";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(["message" => "Succès"]);
    } else {
        echo json_encode(["erreur" => "Erreur lors de l'enregistrement"]);
    }
}

$conn->close();
?>