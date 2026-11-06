/** Follow-up field tasks offered after an AI photo diagnosis in Crop Doctor. */
const L = (en, hi, kn) => ({ en, hi, kn });

export const removeLeaves = (days = 2) => ({
  days,
  category: 'inspection',
  title: L('Remove and destroy infected leaves', 'संक्रमित पत्ते तोड़कर नष्ट करें', 'ಸೋಂಕಿತ ಎಲೆಗಳನ್ನು ತೆಗೆದು ನಾಶಮಾಡಿ'),
});
export const sprayDry = (days = 3) => ({
  days,
  category: 'inspection',
  title: L('Spray the chosen remedy on a dry, calm day', 'चुना हुआ उपाय सूखे, शांत दिन छिड़कें', 'ಆಯ್ದ ಪರಿಹಾರವನ್ನು ಒಣ, ಗಾಳಿ ಇಲ್ಲದ ದಿನ ಸಿಂಪಡಿಸಿ'),
});
export const recheck = (days = 7) => ({
  days,
  category: 'inspection',
  title: L('Re-inspect the field and take a new photo', 'खेत फिर जांचें और नई फोटो लें', 'ಹೊಲವನ್ನು ಮತ್ತೆ ಪರೀಕ್ಷಿಸಿ ಹೊಸ ಫೋಟೋ ತೆಗೆಯಿರಿ'),
});
