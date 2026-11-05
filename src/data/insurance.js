/**
 * Crop Loss / Insurance (PMFBY) reference data.
 * Content summarises the published PMFBY operational guidelines. Anything that
 * varies by state / season / notification is flagged with `depends: true`.
 */
const L = (en, hi, kn) => ({ en, hi, kn });

export const LINKS = {
  portal: 'https://pmfby.gov.in/',
  helpline: '14447',
  helplineTel: 'tel:14447',
};

export const DAMAGE_TYPES = ['heavyRain', 'flood', 'hailstorm', 'cyclone', 'drought', 'landslide', 'cloudburst', 'lightningFire', 'pest', 'other'];

/** Perils covered for post-harvest losses (crop in cut & spread condition, up to 14 days). */
export const POST_HARVEST_PERILS = ['hailstorm', 'cyclone', 'heavyRain'];
/** Localized calamities assessed on an individual-farm basis. */
export const LOCALIZED_PERILS = ['hailstorm', 'landslide', 'flood', 'cloudburst', 'lightningFire'];
/** Widespread perils for standing crops – assessed on an area (yield) basis. */
export const AREA_PERILS = ['drought', 'cyclone', 'pest'];

export const CHECKLIST = ['field', 'closeup', 'extent', 'location', 'docs'];
export const CLAIM_STATUSES = ['draft', 'prepared', 'reported', 'assessment', 'approved', 'paid', 'rejected'];
export const PHOTO_LIMIT = 8;
export const DEADLINE_HOURS = 72;
export const POST_HARVEST_DAYS = 14;

export const pmfbyInfo = [
  {
    id: 'what',
    title: L('What is PMFBY?', 'PMFBY क्या है?', 'PMFBY ಎಂದರೇನು?'),
    body: L(
      'Pradhan Mantri Fasal Bima Yojana (PMFBY) is the Government of India’s crop insurance scheme. It protects farmers growing notified crops in notified areas against crop loss from natural calamities, pests and diseases. The farmer pays a small premium; the rest is paid by the central and state governments.',
      'प्रधानमंत्री फसल बीमा योजना (PMFBY) भारत सरकार की फसल बीमा योजना है। यह अधिसूचित क्षेत्रों में अधिसूचित फसल उगाने वाले किसानों को प्राकृतिक आपदा, कीट और रोग से फसल नुकसान के विरुद्ध सुरक्षा देती है। किसान कम प्रीमियम देता है; बाकी केंद्र और राज्य सरकार देती हैं।',
      'ಪ್ರಧಾನಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (PMFBY) ಭಾರತ ಸರ್ಕಾರದ ಬೆಳೆ ವಿಮಾ ಯೋಜನೆ. ಅಧಿಸೂಚಿತ ಪ್ರದೇಶಗಳಲ್ಲಿ ಅಧಿಸೂಚಿತ ಬೆಳೆ ಬೆಳೆಯುವ ರೈತರಿಗೆ ನೈಸರ್ಗಿಕ ವಿಕೋಪ, ಕೀಟ ಮತ್ತು ರೋಗದಿಂದ ಆಗುವ ಬೆಳೆ ನಷ್ಟಕ್ಕೆ ರಕ್ಷಣೆ ನೀಡುತ್ತದೆ. ರೈತರು ಸಣ್ಣ ಪ್ರೀಮಿಯಂ ಪಾವತಿಸುತ್ತಾರೆ; ಉಳಿದದ್ದನ್ನು ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಸರ್ಕಾರಗಳು ಭರಿಸುತ್ತವೆ.'
    ),
  },
  {
    id: 'who',
    title: L('Who can join?', 'कौन जुड़ सकता है?', 'ಯಾರು ಸೇರಬಹುದು?'),
    points: [
      L('All farmers – including sharecroppers and tenant farmers – growing notified crops in notified areas.', 'अधिसूचित क्षेत्रों में अधिसूचित फसल उगाने वाले सभी किसान – बटाईदार और काश्तकार सहित।', 'ಅಧಿಸೂಚಿತ ಪ್ರದೇಶಗಳಲ್ಲಿ ಅಧಿಸೂಚಿತ ಬೆಳೆ ಬೆಳೆಯುವ ಎಲ್ಲಾ ರೈತರು – ಪಾಲುದಾರ ಮತ್ತು ಗೇಣಿ ರೈತರೂ ಸೇರಿ.'),
      L('Enrolment is voluntary for all farmers, including those with crop loans.', 'नामांकन सभी किसानों के लिए स्वैच्छिक है, फसल ऋण वाले किसानों सहित।', 'ಬೆಳೆ ಸಾಲ ಪಡೆದವರೂ ಸೇರಿ ಎಲ್ಲಾ ರೈತರಿಗೆ ನೋಂದಣಿ ಸ್ವಯಂಪ್ರೇರಿತ.'),
      L('You must enrol before the cut-off date announced for each season.', 'हर सीज़न के लिए घोषित अंतिम तारीख से पहले नामांकन ज़रूरी है।', 'ಪ್ರತಿ ಹಂಗಾಮಿಗೆ ಘೋಷಿಸಿದ ಕೊನೆಯ ದಿನಾಂಕದೊಳಗೆ ನೋಂದಾಯಿಸಬೇಕು.'),
      L('Enrol through your bank, a Common Service Centre (CSC), an insurance agent or the PMFBY portal / app.', 'अपने बैंक, कॉमन सर्विस सेंटर (CSC), बीमा एजेंट या PMFBY पोर्टल / ऐप से नामांकन करें।', 'ನಿಮ್ಮ ಬ್ಯಾಂಕ್, ಕಾಮನ್ ಸರ್ವಿಸ್ ಸೆಂಟರ್ (CSC), ವಿಮಾ ಏಜೆಂಟ್ ಅಥವಾ PMFBY ಪೋರ್ಟಲ್ / ಆ್ಯಪ್ ಮೂಲಕ ನೋಂದಾಯಿಸಿ.'),
    ],
    depends: true,
  },
  {
    id: 'premium',
    title: L('Farmer’s premium share', 'किसान का प्रीमियम हिस्सा', 'ರೈತರ ಪ್ರೀಮಿಯಂ ಪಾಲು'),
    points: [
      L('Kharif food & oilseed crops: up to 2% of the sum insured.', 'खरीफ खाद्य और तिलहन फसलें: बीमित राशि का अधिकतम 2%।', 'ಮುಂಗಾರು ಆಹಾರ ಮತ್ತು ಎಣ್ಣೆಕಾಳು ಬೆಳೆ: ವಿಮಾ ಮೊತ್ತದ ಗರಿಷ್ಠ 2%.'),
      L('Rabi food & oilseed crops: up to 1.5% of the sum insured.', 'रबी खाद्य और तिलहन फसलें: बीमित राशि का अधिकतम 1.5%।', 'ಹಿಂಗಾರು ಆಹಾರ ಮತ್ತು ಎಣ್ಣೆಕಾಳು ಬೆಳೆ: ವಿಮಾ ಮೊತ್ತದ ಗರಿಷ್ಠ 1.5%.'),
      L('Annual commercial / horticultural crops: up to 5% of the sum insured.', 'वार्षिक व्यावसायिक / बागवानी फसलें: बीमित राशि का अधिकतम 5%।', 'ವಾರ್ಷಿಕ ವಾಣಿಜ್ಯ / ತೋಟಗಾರಿಕೆ ಬೆಳೆ: ವಿಮಾ ಮೊತ್ತದ ಗರಿಷ್ಠ 5%.'),
      L('The sum insured per hectare is fixed for each crop and district.', 'प्रति हेक्टेयर बीमित राशि हर फसल और ज़िले के लिए तय होती है।', 'ಹೆಕ್ಟೇರ್‌ಗೆ ವಿಮಾ ಮೊತ್ತವನ್ನು ಪ್ರತಿ ಬೆಳೆ ಮತ್ತು ಜಿಲ್ಲೆಗೆ ನಿಗದಿಪಡಿಸಲಾಗುತ್ತದೆ.'),
    ],
    depends: true,
  },
  {
    id: 'risks',
    title: L('Risks covered', 'कवर किए गए जोखिम', 'ರಕ್ಷಣೆ ಇರುವ ಅಪಾಯಗಳು'),
    points: [
      L('Prevented sowing / planting due to adverse weather.', 'खराब मौसम के कारण बुवाई / रोपाई न हो पाना।', 'ಪ್ರತಿಕೂಲ ಹವಾಮಾನದಿಂದ ಬಿತ್ತನೆ / ನಾಟಿ ಸಾಧ್ಯವಾಗದಿರುವುದು.'),
      L('Standing crop (sowing to harvest): yield loss from drought, dry spell, flood, inundation, pests and diseases, landslide, natural fire and lightning, storm, hailstorm and cyclone.', 'खड़ी फसल (बुवाई से कटाई तक): सूखा, सूखा दौर, बाढ़, जलभराव, कीट-रोग, भूस्खलन, प्राकृतिक आग और बिजली, तूफ़ान, ओलावृष्टि और चक्रवात से उपज नुकसान।', 'ನಿಂತ ಬೆಳೆ (ಬಿತ್ತನೆಯಿಂದ ಕೊಯ್ಲಿನವರೆಗೆ): ಬರ, ಒಣ ಹವೆ, ಪ್ರವಾಹ, ಜಲಾವೃತ, ಕೀಟ-ರೋಗ, ಭೂಕುಸಿತ, ನೈಸರ್ಗಿಕ ಬೆಂಕಿ ಮತ್ತು ಸಿಡಿಲು, ಬಿರುಗಾಳಿ, ಆಲಿಕಲ್ಲು ಮಳೆ ಮತ್ತು ಚಂಡಮಾರುತದಿಂದ ಇಳುವರಿ ನಷ್ಟ.'),
      L('Localized calamities on individual farms: hailstorm, landslide, inundation, cloudburst and natural fire due to lightning.', 'व्यक्तिगत खेतों पर स्थानीय आपदाएं: ओलावृष्टि, भूस्खलन, जलभराव, बादल फटना और बिजली से प्राकृतिक आग।', 'ವೈಯಕ್ತಿಕ ಹೊಲಗಳ ಸ್ಥಳೀಯ ವಿಕೋಪಗಳು: ಆಲಿಕಲ್ಲು ಮಳೆ, ಭೂಕುಸಿತ, ಜಲಾವೃತ, ಮೇಘಸ್ಫೋಟ ಮತ್ತು ಸಿಡಿಲಿನಿಂದ ನೈಸರ್ಗಿಕ ಬೆಂಕಿ.'),
      L('Post-harvest losses: crop kept in “cut and spread” condition in the field, up to 14 days after harvest, against hailstorm, cyclone, cyclonic rain and unseasonal rain.', 'कटाई के बाद नुकसान: कटाई के 14 दिन तक खेत में “काटकर फैलाई” फसल को ओलावृष्टि, चक्रवात, चक्रवाती वर्षा और बेमौसम वर्षा से नुकसान।', 'ಕೊಯ್ಲೋತ್ತರ ನಷ್ಟ: ಕೊಯ್ಲಿನ ನಂತರ 14 ದಿನಗಳವರೆಗೆ ಹೊಲದಲ್ಲಿ “ಕೊಯ್ದು ಹರಡಿದ” ಬೆಳೆಗೆ ಆಲಿಕಲ್ಲು ಮಳೆ, ಚಂಡಮಾರುತ, ಚಂಡಮಾರುತದ ಮಳೆ ಮತ್ತು ಅಕಾಲಿಕ ಮಳೆಯಿಂದ ನಷ್ಟ.'),
      L('Mid-season adversity and add-on covers (for example, wild-animal attack) apply only where the state has notified them.', 'मध्य-सीज़न प्रतिकूलता और अतिरिक्त कवर (जैसे जंगली जानवरों का हमला) केवल वहीं लागू होते हैं जहां राज्य ने अधिसूचित किया हो।', 'ಮಧ್ಯ-ಹಂಗಾಮಿನ ಪ್ರತಿಕೂಲತೆ ಮತ್ತು ಹೆಚ್ಚುವರಿ ರಕ್ಷಣೆ (ಉದಾ. ಕಾಡುಪ್ರಾಣಿ ದಾಳಿ) ರಾಜ್ಯ ಅಧಿಸೂಚಿಸಿದ ಕಡೆ ಮಾತ್ರ ಅನ್ವಯ.'),
    ],
    depends: true,
  },
  {
    id: 'claims',
    title: L('Types of claims', 'दावों के प्रकार', 'ಕ್ಲೇಮ್‌ಗಳ ವಿಧಗಳು'),
    points: [
      L('Area-based (most common): losses to standing crops from widespread perils are measured with crop-cutting experiments / yield data for the whole notified area. If the area’s actual yield is below the threshold yield, all insured farmers there are compensated – no individual claim is usually needed.', 'क्षेत्र-आधारित (सबसे आम): व्यापक आपदाओं से खड़ी फसल के नुकसान का आकलन पूरे अधिसूचित क्षेत्र के फसल कटाई प्रयोग / उपज डेटा से होता है। क्षेत्र की वास्तविक उपज थ्रेशोल्ड उपज से कम होने पर वहां के सभी बीमित किसानों को मुआवज़ा मिलता है – आमतौर पर व्यक्तिगत दावा ज़रूरी नहीं।', 'ಪ್ರದೇಶ ಆಧಾರಿತ (ಹೆಚ್ಚು ಸಾಮಾನ್ಯ): ವ್ಯಾಪಕ ವಿಕೋಪಗಳಿಂದ ನಿಂತ ಬೆಳೆಯ ನಷ್ಟವನ್ನು ಇಡೀ ಅಧಿಸೂಚಿತ ಪ್ರದೇಶದ ಬೆಳೆ ಕಟಾವು ಪ್ರಯೋಗ / ಇಳುವರಿ ಮಾಹಿತಿಯಿಂದ ಅಳೆಯಲಾಗುತ್ತದೆ. ಪ್ರದೇಶದ ನಿಜ ಇಳುವರಿ ಮಿತಿ ಇಳುವರಿಗಿಂತ ಕಡಿಮೆಯಾದರೆ ಅಲ್ಲಿನ ಎಲ್ಲಾ ವಿಮಾದಾರ ರೈತರಿಗೆ ಪರಿಹಾರ – ಸಾಮಾನ್ಯವಾಗಿ ವೈಯಕ್ತಿಕ ಕ್ಲೇಮ್ ಬೇಡ.'),
      L('Individual (localized calamity or post-harvest loss): your own field is assessed. You must report the loss within 72 hours.', 'व्यक्तिगत (स्थानीय आपदा या कटाई-बाद नुकसान): आपके खेत का आकलन होता है। नुकसान की सूचना 72 घंटे के भीतर देनी होती है।', 'ವೈಯಕ್ತಿಕ (ಸ್ಥಳೀಯ ವಿಕೋಪ ಅಥವಾ ಕೊಯ್ಲೋತ್ತರ ನಷ್ಟ): ನಿಮ್ಮ ಹೊಲವನ್ನೇ ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗುತ್ತದೆ. 72 ಗಂಟೆಗಳೊಳಗೆ ನಷ್ಟ ವರದಿ ಮಾಡಬೇಕು.'),
      L('Prevented sowing and mid-season adversity are declared for an area by the state government.', 'बुवाई न हो पाना और मध्य-सीज़न प्रतिकूलता क्षेत्र के लिए राज्य सरकार घोषित करती है।', 'ಬಿತ್ತನೆ ಸಾಧ್ಯವಾಗದಿರುವುದು ಮತ್ತು ಮಧ್ಯ-ಹಂಗಾಮಿನ ಪ್ರತಿಕೂಲತೆಯನ್ನು ರಾಜ್ಯ ಸರ್ಕಾರ ಪ್ರದೇಶಕ್ಕೆ ಘೋಷಿಸುತ್ತದೆ.'),
    ],
  },
  {
    id: 'reporting',
    title: L('Reporting requirements & deadlines', 'सूचना देने की शर्तें और समय-सीमा', 'ವರದಿ ಅಗತ್ಯಗಳು ಮತ್ತು ಗಡುವು'),
    points: [
      L('Localized calamities and post-harvest losses: inform within 72 hours of the event.', 'स्थानीय आपदा और कटाई-बाद नुकसान: घटना के 72 घंटे के भीतर सूचना दें।', 'ಸ್ಥಳೀಯ ವಿಕೋಪ ಮತ್ತು ಕೊಯ್ಲೋತ್ತರ ನಷ್ಟ: ಘಟನೆಯ 72 ಗಂಟೆಗಳೊಳಗೆ ತಿಳಿಸಿ.'),
      L('Report through: helpline 14447, the PMFBY portal / Crop Insurance app, your insurance company, your bank, or the agriculture department.', 'सूचना के माध्यम: हेल्पलाइन 14447, PMFBY पोर्टल / क्रॉप इंश्योरेंस ऐप, बीमा कंपनी, आपका बैंक या कृषि विभाग।', 'ವರದಿ ಮಾರ್ಗಗಳು: ಸಹಾಯವಾಣಿ 14447, PMFBY ಪೋರ್ಟಲ್ / ಕ್ರಾಪ್ ಇನ್ಶೂರೆನ್ಸ್ ಆ್ಯಪ್, ವಿಮಾ ಕಂಪನಿ, ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಅಥವಾ ಕೃಷಿ ಇಲಾಖೆ.'),
      L('Give the crop, insured area, survey number, cause, date of loss and extent of damage. Note the docket number you receive.', 'फसल, बीमित क्षेत्र, सर्वे नंबर, कारण, नुकसान की तारीख और नुकसान की मात्रा बताएं। मिली डॉकेट संख्या लिख लें।', 'ಬೆಳೆ, ವಿಮೆ ವಿಸ್ತೀರ್ಣ, ಸರ್ವೆ ನಂಬರ್, ಕಾರಣ, ನಷ್ಟದ ದಿನಾಂಕ ಮತ್ತು ಹಾನಿಯ ಪ್ರಮಾಣ ತಿಳಿಸಿ. ಸಿಗುವ ಡಾಕೆಟ್ ಸಂಖ್ಯೆ ಬರೆದಿಡಿ.'),
      L('Area-based losses do not usually need an individual report, but you can still inform your bank or insurer.', 'क्षेत्र-आधारित नुकसान के लिए आमतौर पर व्यक्तिगत सूचना ज़रूरी नहीं, फिर भी आप बैंक या बीमा कंपनी को बता सकते हैं।', 'ಪ್ರದೇಶ ಆಧಾರಿತ ನಷ್ಟಕ್ಕೆ ಸಾಮಾನ್ಯವಾಗಿ ವೈಯಕ್ತಿಕ ವರದಿ ಬೇಡ, ಆದರೂ ಬ್ಯಾಂಕ್ ಅಥವಾ ವಿಮಾ ಕಂಪನಿಗೆ ತಿಳಿಸಬಹುದು.'),
    ],
  },
  {
    id: 'relief',
    title: L('Crop insurance vs. disaster relief', 'फसल बीमा बनाम आपदा राहत', 'ಬೆಳೆ ವಿಮೆ ಮತ್ತು ವಿಪತ್ತು ಪರಿಹಾರದ ವ್ಯತ್ಯಾಸ'),
    body: L(
      'Crop insurance (PMFBY) is a contract: you pay a premium and claims follow the scheme rules. Disaster relief is government assistance (input subsidy under SDRF / NDRF norms) given after a calamity is declared, generally where crop loss is 33% or more – even for uninsured farmers. You can be eligible for both; they are applied for separately.',
      'फसल बीमा (PMFBY) एक अनुबंध है: आप प्रीमियम देते हैं और दावे योजना के नियमों से तय होते हैं। आपदा राहत सरकारी सहायता है (SDRF / NDRF मानदंडों के तहत इनपुट सब्सिडी), जो आपदा घोषित होने पर आमतौर पर 33% या अधिक फसल नुकसान पर दी जाती है – बिना बीमा वाले किसानों को भी। आप दोनों के पात्र हो सकते हैं; दोनों के लिए अलग-अलग आवेदन होता है।',
      'ಬೆಳೆ ವಿಮೆ (PMFBY) ಒಂದು ಒಪ್ಪಂದ: ನೀವು ಪ್ರೀಮಿಯಂ ಪಾವತಿಸುತ್ತೀರಿ, ಕ್ಲೇಮ್ ಯೋಜನೆಯ ನಿಯಮದಂತೆ ನಡೆಯುತ್ತದೆ. ವಿಪತ್ತು ಪರಿಹಾರ ಸರ್ಕಾರಿ ನೆರವು (SDRF / NDRF ಮಾನದಂಡದಡಿ ಇನ್‌ಪುಟ್ ಸಬ್ಸಿಡಿ); ವಿಕೋಪ ಘೋಷಿಸಿದ ನಂತರ ಸಾಮಾನ್ಯವಾಗಿ 33% ಅಥವಾ ಹೆಚ್ಚು ಬೆಳೆ ನಷ್ಟಕ್ಕೆ ನೀಡಲಾಗುತ್ತದೆ – ವಿಮೆ ಇಲ್ಲದ ರೈತರಿಗೂ. ಎರಡಕ್ಕೂ ಅರ್ಹರಾಗಬಹುದು; ಪ್ರತ್ಯೇಕವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು.'
    ),
    depends: true,
  },
  {
    id: 'documents',
    title: L('Keep these ready', 'ये तैयार रखें', 'ಇವುಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ'),
    points: [
      L('PMFBY policy / application receipt and premium proof', 'PMFBY पॉलिसी / आवेदन रसीद और प्रीमियम प्रमाण', 'PMFBY ಪಾಲಿಸಿ / ಅರ್ಜಿ ರಸೀದಿ ಮತ್ತು ಪ್ರೀಮಿಯಂ ಪುರಾವೆ'),
      L('Land record (RTC / khasra) with survey number; tenancy / sowing declaration if you are a tenant', 'सर्वे नंबर सहित ज़मीन रिकॉर्ड (आरटीसी / खसरा); काश्तकार हों तो किरायेदारी / बुवाई घोषणा', 'ಸರ್ವೆ ನಂಬರ್ ಇರುವ ಪಹಣಿ; ಗೇಣಿದಾರರಾದರೆ ಗೇಣಿ / ಬಿತ್ತನೆ ಘೋಷಣೆ'),
      L('Aadhaar card and the mobile number used for enrolment', 'आधार कार्ड और नामांकन में दिया मोबाइल नंबर', 'ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ನೋಂದಣಿಗೆ ನೀಡಿದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ'),
      L('Dated photos of the damage and the date / time of the event', 'नुकसान की तारीख वाली फोटो और घटना की तारीख / समय', 'ದಿನಾಂಕವಿರುವ ಹಾನಿಯ ಫೋಟೋ ಮತ್ತು ಘಟನೆಯ ದಿನಾಂಕ / ಸಮಯ'),
      L('Bank passbook for your own reference (never share PINs, OTPs or passwords)', 'अपने संदर्भ के लिए बैंक पासबुक (PIN, OTP या पासवर्ड कभी साझा न करें)', 'ನಿಮ್ಮ ಉಲ್ಲೇಖಕ್ಕಾಗಿ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ (PIN, OTP ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಎಂದಿಗೂ ಹಂಚಬೇಡಿ)'),
    ],
  },
  {
    id: 'exclusions',
    title: L('Not covered', 'कवर नहीं', 'ರಕ್ಷಣೆ ಇಲ್ಲದವು'),
    points: [
      L('Losses from war, nuclear risks, riots or malicious damage', 'युद्ध, परमाणु जोखिम, दंगे या जानबूझकर किए गए नुकसान', 'ಯುದ್ಧ, ಅಣು ಅಪಾಯ, ಗಲಭೆ ಅಥವಾ ಉದ್ದೇಶಪೂರ್ವಕ ಹಾನಿ'),
      L('Theft, and damage by domestic or wild animals (unless a state add-on covers it)', 'चोरी, और पालतू या जंगली जानवरों से नुकसान (जब तक राज्य का अतिरिक्त कवर न हो)', 'ಕಳ್ಳತನ, ಮತ್ತು ಸಾಕು ಅಥವಾ ಕಾಡುಪ್ರಾಣಿಗಳಿಂದ ಹಾನಿ (ರಾಜ್ಯದ ಹೆಚ್ಚುವರಿ ರಕ್ಷಣೆ ಇಲ್ಲದಿದ್ದರೆ)'),
      L('Other preventable risks, and crops or areas that are not notified', 'अन्य रोके जा सकने वाले जोखिम, और अधिसूचित न की गई फसलें या क्षेत्र', 'ಇತರ ತಡೆಯಬಹುದಾದ ಅಪಾಯಗಳು ಮತ್ತು ಅಧಿಸೂಚಿತವಲ್ಲದ ಬೆಳೆ ಅಥವಾ ಪ್ರದೇಶ'),
    ],
  },
];
