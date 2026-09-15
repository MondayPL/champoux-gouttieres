import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const DEMO_FIELDS = {
  numContrat: "29999",
  date: new Date().toISOString().slice(0, 10),
  nom: "Tremblay",
  prenom: "Jean",
  telephone: "8195551234",
  civique: "100",
  rue: "rue Principale",
  villeNom: "Victoriaville",
  gouttiere: "blanc",
  piedLinG: 96,
  descente: "blanc",
  piedLinD: 28,
  equip: null,
  enlvExist: false,
  friseIncl: false,
  toitTole: false,
  montant: 2780,
  grille: null,
  piedLinGr: null,
  statut: "Extraction démo — vérifier sur place.",
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!image || !(image instanceof File)) {
      return NextResponse.json({ error: "Image requise." }, { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        demo: true,
        fields: DEMO_FIELDS,
        message: "Mode démo — aucune OPENAI_API_KEY.",
      });
    }
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mime = image.type || "image/jpeg";
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Extrais une soumission manuscrite de gouttières (Québec). JSON avec:
numContrat, date (YYYY-MM-DD), nom, prenom, telephone, civique, rue, villeNom,
gouttiere, piedLinG, descente, piedLinD, equip, enlvExist (bool), friseIncl (bool),
toitTole (bool), montant, grille, piedLinGr, statut (notes). Null si illisible.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extrais les champs de cette soumission." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    let fields: Record<string, unknown>;
    try { fields = JSON.parse(raw); } catch { fields = { ...DEMO_FIELDS }; }
    return NextResponse.json({ demo: false, fields });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      demo: true,
      fields: DEMO_FIELDS,
      error: e instanceof Error ? e.message : "Erreur",
    });
  }
}
