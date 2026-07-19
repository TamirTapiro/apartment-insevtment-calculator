// js/fields.js — declarative config. `path` maps into state.values.
// widget: 'money' (default numeric), 'computed-tax', 'percent-fee', 'mortgage',
//         'renovation', 'itemlist', 'income-tax', 'arnona', 'apt-type'
export const CATEGORIES = [
  { id: 'purchase', titleKey: 'cat_purchase', fields: [
    { id: 'price', path: 'price', labelKey: 'f_price', unit: 'once', tooltipKey: 'tt_price', widget: 'money' },
    { id: 'aptType', path: 'apartmentType', labelKey: 'f_apt_type', unit: 'once', widget: 'apt-type' },
    { id: 'purchaseTax', path: 'purchaseTax', labelKey: 'f_purchase_tax', unit: 'once', tooltipKey: 'tt_purchase_tax', widget: 'computed-tax' },
    { id: 'brokerage', path: 'brokerage', labelKey: 'f_brokerage', unit: 'once', tooltipKey: 'tt_brokerage', widget: 'percent-fee', pctPath: 'brokeragePct' },
    { id: 'attorney', path: 'attorney', labelKey: 'f_attorney', unit: 'once', tooltipKey: 'tt_attorney', widget: 'percent-fee', pctPath: 'attorneyPct' },
    { id: 'tabu', path: 'tabu', labelKey: 'f_tabu', unit: 'once', tooltipKey: 'tt_tabu', widget: 'money' },
  ]},
  { id: 'mortgage', titleKey: 'cat_mortgage', fields: [
    { id: 'advisor', path: 'advisor', labelKey: 'f_advisor', unit: 'once', tooltipKey: 'tt_advisor', widget: 'money' },
    { id: 'fileOpening', path: 'fileOpening', labelKey: 'f_file_opening', unit: 'once', tooltipKey: 'tt_file_opening', widget: 'money' },
    { id: 'appraiser', path: 'appraiser', labelKey: 'f_appraiser', unit: 'once', tooltipKey: 'tt_appraiser', widget: 'money' },
    { id: 'lifeBuilding', path: 'lifeBuilding', labelKey: 'f_insurance_life', unit: 'month', tooltipKey: 'tt_insurance_life', widget: 'money' },
    { id: 'financing', path: 'mortgage', labelKey: 'f_finance_toggle', unit: 'once', widget: 'mortgage' },
  ]},
  { id: 'reno', titleKey: 'cat_reno', fields: [
    { id: 'renovation', path: 'renovation', labelKey: 'f_reno', unit: 'once', tooltipKey: 'tt_reno', widget: 'renovation' },
    { id: 'furniture', path: 'furniture', labelKey: 'f_furniture', unit: 'once', tooltipKey: 'tt_furniture', widget: 'itemlist' },
    { id: 'upgrades', path: 'upgrades', labelKey: 'f_upgrades', unit: 'once', tooltipKey: 'tt_upgrades', widget: 'itemlist' },
  ]},
  { id: 'operating', titleKey: 'cat_operating', fields: [
    { id: 'rent', path: 'rent', labelKey: 'f_rent', unit: 'month', tooltipKey: 'tt_rent', widget: 'money' },
    { id: 'arnona', path: 'arnona', labelKey: 'f_arnona', unit: 'month', tooltipKey: 'tt_arnona', widget: 'arnona' },
    { id: 'houseCommittee', path: 'houseCommittee', labelKey: 'f_house_committee', unit: 'month', tooltipKey: 'tt_house_committee', widget: 'money' },
    { id: 'currentBills', path: 'currentBills', labelKey: 'f_bills', unit: 'month', tooltipKey: 'tt_bills', widget: 'money' },
    { id: 'buildingContents', path: 'buildingContents', labelKey: 'f_building_contents', unit: 'month', tooltipKey: 'tt_building_contents', widget: 'money' },
    { id: 'incomeTax', path: 'incomeTax', labelKey: 'f_income_tax', unit: 'month', tooltipKey: 'tt_income_tax', widget: 'income-tax' },
  ]},
  { id: 'maintenance', titleKey: 'cat_maintenance', fields: [
    { id: 'repairs', path: 'repairs', labelKey: 'f_repairs', unit: 'month', tooltipKey: 'tt_repairs', widget: 'money' },
    { id: 'futureFund', path: 'futureFund', labelKey: 'f_future_fund', unit: 'month', tooltipKey: 'tt_future_fund', widget: 'money' },
  ]},
  { id: 'admin', titleKey: 'cat_admin', fields: [
    { id: 'rentalBrokerage', path: 'rentalBrokerage', labelKey: 'f_rental_brokerage', unit: 'once', tooltipKey: 'tt_rental_brokerage', widget: 'money' },
    { id: 'management', path: 'management', labelKey: 'f_management', unit: 'month', tooltipKey: 'tt_management', widget: 'money' },
    { id: 'advertising', path: 'advertising', labelKey: 'f_advertising', unit: 'year', tooltipKey: 'tt_advertising', widget: 'money' },
    { id: 'legal', path: 'legal', labelKey: 'f_legal', unit: 'year', tooltipKey: 'tt_legal', widget: 'money' },
    { id: 'vacancy', path: 'vacancyMonths', labelKey: 'f_vacancy', unit: 'once', tooltipKey: 'tt_vacancy', widget: 'number' },
  ]},
];
