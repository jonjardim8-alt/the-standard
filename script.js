(function(){
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const STORAGE_KEY = 'weeklySchedule.v5';
  const START_HOUR = 5;
  const END_HOUR = 23;

  const RECURRING_BLOCKS = [
    { id:'work-mon',  day:'Mon', start:'08:00', end:'16:00', category:'work',  label:'Work' },
    { id:'work-tue',  day:'Tue', start:'08:00', end:'16:00', category:'work',  label:'Work' },
    { id:'work-fri',  day:'Fri', start:'09:00', end:'15:00', category:'work',  label:'Work' },
    { id:'class-thu', day:'Thu', start:'10:00', end:'11:45', category:'school', label:'Class',
      startDate:'2026-08-25', endDate:'2026-12-13', excludeDates:['2026-11-26'] },
    { id:'walk-mon', day:'Mon', start:'06:00', end:'06:15', category:'health', label:'Morning Walk',
      startDate:'2026-08-25', endDate:'2026-09-18' },
    { id:'walk-tue', day:'Tue', start:'06:00', end:'06:15', category:'health', label:'Morning Walk',
      startDate:'2026-08-25', endDate:'2026-09-18' },
    { id:'walk-fri', day:'Fri', start:'06:00', end:'06:15', category:'health', label:'Morning Walk',
      startDate:'2026-08-25', endDate:'2026-09-18' },
    { id:'gym-mon', day:'Mon', start:'18:00', end:'20:00', category:'health', label:'Gym' },
    { id:'gym-tue', day:'Tue', start:'18:00', end:'20:00', category:'health', label:'Gym' },
    { id:'gym-wed', day:'Wed', start:'09:30', end:'11:30', category:'health', label:'Gym' },
    { id:'gym-thu', day:'Thu', start:'12:00', end:'14:00', category:'health', label:'Gym' },
    { id:'gym-fri', day:'Fri', start:'17:00', end:'19:00', category:'health', label:'Gym' },
  ];

  // Quick-add presets — pre-filled events for recurring commitments where the
  // specific time/role varies week to week. Each can carry an endTime so the
  // block view shades the full span, not just the start.
  const PRESET_EVENTS = [
    { id:'quay-students-worship',  label:'Worship Team — Quay Students',      category:'faith', time:'16:45', endTime:'21:00', day:'Wed' },
    { id:'quay-students-crew',     label:'Crew Leader — Quay Students',       category:'faith', time:'18:00', endTime:'21:00', day:'Wed' },
    { id:'quay-ya-worship',        label:'Worship Team — Quay Young Adults',  category:'faith', time:'16:45', endTime:'21:00', day:'Thu' },
    { id:'quay-ya-attending',      label:'Attending — Quay Young Adults',     category:'faith', time:'18:00', endTime:'21:00', day:'Thu' },
    { id:'quay-church-kids',       label:'Kids Worship Team — Quay Church',   category:'faith', time:'06:45', endTime:'13:30', day:'Sun' },
    { id:'quay-church-main',       label:'Main Worship Team — Quay Church',   category:'faith', time:'06:15', endTime:'13:30', day:'Sun' },
    { id:'quay-church-attending',  label:'Attending — Quay Church',           category:'faith', time:'08:00', endTime:'13:30', day:'Sun' },
  ];

  const CATEGORIES = [
    { id:'work',     label:'Work',     color:'#5B8DEF' },
    { id:'school',   label:'School',   color:'#3FC7D6' },
    { id:'health',   label:'Health',   color:'#3CBF8C' },
    { id:'personal', label:'Personal', color:'#F2A93B' },
    { id:'faith',    label:'Faith',    color:'#B18CF2' },
  ];
  const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  // Matches the categories + Type field from the connected Google Form
  // exactly, so entries stay consistent with the existing sheet.
  const BUDGET_TYPE_COLORS = { expense:'#F2617A', income:'#3CBF8C', neutral:'#5B8DEF' };
  const BUDGET_CATEGORIES = [
    { id:'gas',             label:'Gas',              type:'expense' },
    { id:'tithes',          label:'Tithes',           type:'expense' },
    { id:'car-maintenance', label:'Car Maintenance',  type:'expense' },
    { id:'groceries',       label:'Groceries',        type:'expense' },
    { id:'dining-out',      label:'Dining Out',       type:'expense' },
    { id:'coffee-drinks',   label:'Coffee/Drinks',    type:'expense' },
    { id:'hygiene',         label:'Hygiene',          type:'expense' },
    { id:'golf',            label:'Golf',             type:'expense' },
    { id:'subscriptions',   label:'Subscriptions',    type:'expense' },
    { id:'vacation',        label:'Vacation',         type:'expense' },
    { id:'clothing',        label:'Clothing',         type:'expense' },
    { id:'misc',            label:'Misc',             type:'expense' },
    { id:'emergency-fund',  label:'Emergency Fund',   type:'neutral' },
    { id:'lego-fund',       label:'Lego Fund',        type:'neutral' },
    { id:'travel-fund',     label:'Travel Fund',      type:'neutral' },
    { id:'investing',       label:'Investing',        type:'neutral' },
    { id:'card-payments',   label:'Card Payments',    type:'neutral' },
    { id:'paycheck',        label:'Paycheck',         type:'income' },
    { id:'other-income',    label:'Other Income',     type:'income' },
  ];
  const budgetCatById = Object.fromEntries(BUDGET_CATEGORIES.map(c => [c.id, c]));
  const BUDGET_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1TgbaM_zrRQRZyMsSHmdwid0c1wRK1QkkG_cdl6ZBnyE/edit?usp=sharing';
  const BUDGET_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfcShLhQSfCbCMAXRG1i0mzT6B9DrAL9gSf7nx2A9_fgDGxYg/viewform?usp=sharing';

  // Jan–Jun 2026 transaction history imported from the person's existing
  // Google Sheet (Transaction Form Responses tab). Seeded once.
  const SEED_BUDGET_TRANSACTIONS = [
    { date:'2026-06-10', description:'fresh kitchen', amount:15.45, category:'dining-out' },
    { date:'2026-06-09', description:'gas', amount:20.0, category:'gas' },
    { date:'2026-06-09', description:'food popstroke', amount:16.19, category:'dining-out' },
    { date:'2026-06-09', description:'trex', amount:56.17, category:'dining-out' },
    { date:'2026-06-09', description:'deodorant', amount:41.5, category:'hygiene' },
    { date:'2026-06-08', description:'culvers', amount:9.04, category:'dining-out' },
    { date:'2026-06-08', description:'uniqlo', amount:79.77, category:'clothing' },
    { date:'2026-06-08', description:'shoes', amount:73.45, category:'clothing' },
    { date:'2026-06-08', description:'axum', amount:7.39, category:'coffee-drinks' },
    { date:'2026-06-08', description:'madelines', amount:2.45, category:'dining-out' },
    { date:'2026-06-06', description:'publix', amount:10.09, category:'groceries' },
    { date:'2026-06-04', description:'insurance claim money', amount:2500.0, category:'other-income' },
    { date:'2026-06-04', description:'gas', amount:40.0, category:'gas' },
    { date:'2026-06-04', description:'millers', amount:18.96, category:'dining-out' },
    { date:'2026-06-03', description:'icee', amount:16.27, category:'coffee-drinks' },
    { date:'2026-06-03', description:'paycheck', amount:109.89, category:'paycheck' },
    { date:'2026-06-02', description:'chipotle', amount:13.31, category:'dining-out' },
    { date:'2026-06-02', description:'tithes', amount:163.61, category:'tithes' },
    { date:'2026-06-01', description:'4rivers', amount:17.01, category:'dining-out' },
    { date:'2026-05-31', description:'interest', amount:5.23, category:'other-income' },
    { date:'2026-05-31', description:'magoos', amount:7.44, category:'dining-out' },
    { date:'2026-05-30', description:'braden\'s hat', amount:45.0, category:'clothing' },
    { date:'2026-05-30', description:'gas', amount:40.0, category:'gas' },
    { date:'2026-05-29', description:'ajs', amount:12.64, category:'dining-out' },
    { date:'2026-05-29', description:'walgreens', amount:7.33, category:'misc' },
    { date:'2026-05-29', description:'vocal lessons', amount:200.0, category:'misc' },
    { date:'2026-05-29', description:'chick', amount:11.13, category:'dining-out' },
    { date:'2026-05-28', description:'pop and icee', amount:20.85, category:'coffee-drinks' },
    { date:'2026-05-27', description:'money to pay for dads bill', amount:404.77, category:'other-income' },
    { date:'2026-05-27', description:'wendys', amount:9.68, category:'dining-out' },
    { date:'2026-05-27', description:'paycheck', amount:798.3, category:'paycheck' },
    { date:'2026-05-27', description:'dads bill', amount:400.0, category:'misc' },
    { date:'2026-05-27', description:'rileys gift', amount:24.5, category:'misc' },
    { date:'2026-05-26', description:'publix', amount:15.27, category:'misc' },
    { date:'2026-05-25', description:'Kfc', amount:14.25, category:'dining-out' },
    { date:'2026-05-24', description:'clogs', amount:53.35, category:'clothing' },
    { date:'2026-05-24', description:'claude', amount:20.0, category:'subscriptions' },
    { date:'2026-05-24', description:'panda', amount:13.42, category:'dining-out' },
    { date:'2026-05-24', description:'taco bell', amount:8.0, category:'dining-out' },
    { date:'2026-05-23', description:'pre workout', amount:4.0, category:'coffee-drinks' },
    { date:'2026-05-23', description:'gas', amount:40.0, category:'gas' },
    { date:'2026-05-21', description:'deductible on car', amount:2500.0, category:'car-maintenance' },
    { date:'2026-05-21', description:'uber', amount:21.99, category:'misc' },
    { date:'2026-05-21', description:'corona', amount:17.51, category:'misc' },
    { date:'2026-05-20', description:'levi paying for tickets', amount:120.0, category:'other-income' },
    { date:'2026-05-20', description:'switchfoot tickets', amount:120.66, category:'misc' },
    { date:'2026-05-19', description:'chick fila', amount:6.69, category:'dining-out' },
    { date:'2026-05-18', description:'target shirt', amount:42.77, category:'clothing' },
    { date:'2026-05-18', description:'rokkas', amount:24.83, category:'dining-out' },
    { date:'2026-05-18', description:'foxtail 20 for 20', amount:20.0, category:'coffee-drinks' },
    { date:'2026-05-18', description:'dogsitting', amount:150.0, category:'other-income' },
    { date:'2026-05-17', description:'huey magoos', amount:11.7, category:'dining-out' },
    { date:'2026-05-16', description:'chick fil a', amount:5.42, category:'dining-out' },
    { date:'2026-05-16', description:'gas', amount:30.45, category:'gas' },
    { date:'2026-05-16', description:'seven made', amount:8.89, category:'coffee-drinks' },
    { date:'2026-05-16', description:'whole enchilada', amount:15.41, category:'dining-out' },
    { date:'2026-05-16', description:'five guys', amount:17.14, category:'dining-out' },
    { date:'2026-05-15', description:'chick fil a', amount:5.85, category:'dining-out' },
    { date:'2026-05-15', description:'Publix for dad', amount:15.68, category:'misc' },
    { date:'2026-05-15', description:'Cigars', amount:17.58, category:'misc' },
    { date:'2026-05-15', description:'Haircut', amount:45.5, category:'hygiene' },
    { date:'2026-05-15', description:'fingerprinting', amount:17.5, category:'misc' },
    { date:'2026-05-14', description:'Gators', amount:8.93, category:'dining-out' },
    { date:'2026-05-13', description:'poly food', amount:14.15, category:'dining-out' },
    { date:'2026-05-13', description:'chick fila', amount:7.66, category:'dining-out' },
    { date:'2026-05-13', description:'paychekc', amount:835.66, category:'paycheck' },
    { date:'2026-05-13', description:'chipotke', amount:3.35, category:'dining-out' },
    { date:'2026-05-12', description:'spotify', amount:7.88, category:'subscriptions' },
    { date:'2026-05-12', description:'chipotle', amount:12.41, category:'dining-out' },
    { date:'2026-05-12', description:'tax return', amount:96.01, category:'other-income' },
    { date:'2026-05-11', description:'coke', amount:10.21, category:'misc' },
    { date:'2026-05-10', description:'paid back for car pick up', amount:790.0, category:'other-income' },
    { date:'2026-05-08', description:'uber', amount:14.38, category:'misc' },
    { date:'2026-05-08', description:'mcdonalds', amount:10.39, category:'dining-out' },
    { date:'2026-05-08', description:'curl cream', amount:23.38, category:'hygiene' },
    { date:'2026-05-08', description:'picking car up for dad', amount:766.92, category:'misc' },
    { date:'2026-05-08', description:'toothbrush heads', amount:14.99, category:'hygiene' },
    { date:'2026-05-08', description:'chick fil a', amount:2.02, category:'dining-out' },
    { date:'2026-05-08', description:'chipotle', amount:9.53, category:'dining-out' },
    { date:'2026-05-08', description:'shampoo and toothbrush heads', amount:45.16, category:'hygiene' },
    { date:'2026-05-08', description:'paid back for car registration', amount:385.63, category:'other-income' },
    { date:'2026-05-08', description:'mcdonalds', amount:7.33, category:'dining-out' },
    { date:'2026-05-06', description:'clermont national food', amount:15.4, category:'dining-out' },
    { date:'2026-05-06', description:'chick fil a', amount:4.46, category:'dining-out' },
    { date:'2026-05-06', description:'cultivo', amount:8.08, category:'coffee-drinks' },
    { date:'2026-05-05', description:'vanguard', amount:99.31, category:'investing' },
    { date:'2026-05-05', description:'village point', amount:150.0, category:'other-income' },
    { date:'2026-05-04', description:'gas', amount:29.8, category:'gas' },
    { date:'2026-05-04', description:'foxtail', amount:8.28, category:'coffee-drinks' },
    { date:'2026-05-03', description:'tithes', amount:197.98, category:'tithes' },
    { date:'2026-05-03', description:'dad paying me back', amount:235.63, category:'other-income' },
    { date:'2026-05-03', description:'LEGOS', amount:181.03, category:'misc' },
    { date:'2026-05-02', description:'levi\'s gift', amount:50.13, category:'misc' },
    { date:'2026-04-30', description:'interest', amount:6.58, category:'other-income' },
    { date:'2026-04-30', description:'millers', amount:22.51, category:'dining-out' },
    { date:'2026-04-29', description:'paycheck', amount:500.35, category:'paycheck' },
    { date:'2026-04-28', description:'dmv payment', amount:230.0, category:'misc' },
    { date:'2026-04-27', description:'gas', amount:25.82, category:'gas' },
    { date:'2026-04-27', description:'deeply', amount:8.52, category:'coffee-drinks' },
    { date:'2026-04-27', description:'fresh kitchen', amount:11.99, category:'dining-out' },
    { date:'2026-04-27', description:'A LIST', amount:27.68, category:'subscriptions' },
    { date:'2026-04-26', description:'panda', amount:13.42, category:'dining-out' },
    { date:'2026-04-26', description:'icee', amount:9.36, category:'coffee-drinks' },
    { date:'2026-04-25', description:'chick fil a', amount:8.92, category:'dining-out' },
    { date:'2026-04-24', description:'baco bell', amount:7.22, category:'dining-out' },
    { date:'2026-04-24', description:'chilis', amount:29.21, category:'dining-out' },
    { date:'2026-04-24', description:'claude', amount:20.0, category:'subscriptions' },
    { date:'2026-04-22', description:'CORONA', amount:30.0, category:'misc' },
    { date:'2026-04-22', description:'mcdonalds', amount:10.6, category:'dining-out' },
    { date:'2026-04-22', description:'cava', amount:13.74, category:'dining-out' },
    { date:'2026-04-21', description:'panda', amount:15.76, category:'dining-out' },
    { date:'2026-04-19', description:'huey', amount:18.72, category:'dining-out' },
    { date:'2026-04-18', description:'deeply', amount:7.46, category:'coffee-drinks' },
    { date:'2026-04-18', description:'papi smash', amount:19.16, category:'dining-out' },
    { date:'2026-04-18', description:'gas', amount:47.79, category:'gas' },
    { date:'2026-04-18', description:'popcorn!', amount:22.86, category:'dining-out' },
    { date:'2026-04-16', description:'Ralphs', amount:11.43, category:'coffee-drinks' },
    { date:'2026-04-16', description:'Book', amount:21.3, category:'misc' },
    { date:'2026-04-16', description:'Dr p', amount:3.47, category:'coffee-drinks' },
    { date:'2026-04-16', description:'nike brazil longsleeve', amount:100.0, category:'clothing' },
    { date:'2026-04-16', description:'bagels', amount:21.99, category:'dining-out' },
    { date:'2026-04-16', description:'luggage check', amount:20.0, category:'vacation' },
    { date:'2026-04-15', description:'drinks', amount:13.0, category:'coffee-drinks' },
    { date:'2026-04-15', description:'los tacos', amount:12.63, category:'dining-out' },
    { date:'2026-04-15', description:'flight home', amount:29.99, category:'vacation' },
    { date:'2026-04-15', description:'h&m', amount:24.99, category:'clothing' },
    { date:'2026-04-15', description:'joes', amount:16.87, category:'dining-out' },
    { date:'2026-04-15', description:'deo', amount:8.96, category:'hygiene' },
    { date:'2026-04-15', description:'uniqlo', amount:29.9, category:'clothing' },
    { date:'2026-04-15', description:'shake shack', amount:19.36, category:'dining-out' },
    { date:'2026-04-15', description:'subway fares', amount:23.75, category:'vacation' },
    { date:'2026-04-15', description:'coke in airport', amount:4.44, category:'coffee-drinks' },
    { date:'2026-04-15', description:'vocal lessons', amount:200.0, category:'misc' },
    { date:'2026-04-15', description:'NEW YORK hotel and broadway show', amount:206.0, category:'vacation' },
    { date:'2026-04-15', description:'paycheck', amount:756.29, category:'paycheck' },
    { date:'2026-04-15', description:'chatgpt', amount:20.0, category:'subscriptions' },
    { date:'2026-04-14', description:'puttshack', amount:30.0, category:'vacation' },
    { date:'2026-04-14', description:'ice cream', amount:11.77, category:'coffee-drinks' },
    { date:'2026-04-13', description:'dinner for robbie', amount:34.0, category:'misc' },
    { date:'2026-04-13', description:'dinner', amount:34.04, category:'dining-out' },
    { date:'2026-04-13', description:'spotify', amount:7.88, category:'subscriptions' },
    { date:'2026-04-13', description:'bike rental', amount:3.13, category:'vacation' },
    { date:'2026-04-13', description:'breakfast', amount:11.0, category:'dining-out' },
    { date:'2026-04-13', description:'coffee', amount:8.33, category:'coffee-drinks' },
    { date:'2026-04-13', description:'tickets for nates showcase', amount:35.7, category:'misc' },
    { date:'2026-04-13', description:'coffee', amount:7.38, category:'coffee-drinks' },
    { date:'2026-04-12', description:'portillos', amount:23.3, category:'dining-out' },
    { date:'2026-04-11', description:'taco bell', amount:10.94, category:'dining-out' },
    { date:'2026-04-11', description:'chipotle for dad', amount:13.91, category:'dining-out' },
    { date:'2026-04-11', description:'chipotle', amount:10.0, category:'dining-out' },
    { date:'2026-04-10', description:'amazon purchase', amount:224.29, category:'misc' },
    { date:'2026-04-10', description:'deo', amount:36.72, category:'hygiene' },
    { date:'2026-04-09', description:'chipotle for mom', amount:11.02, category:'misc' },
    { date:'2026-04-09', description:'gift bag', amount:3.72, category:'misc' },
    { date:'2026-04-09', description:'millers for ot', amount:28.5, category:'dining-out' },
    { date:'2026-04-09', description:'millers', amount:29.0, category:'dining-out' },
    { date:'2026-04-07', description:'water', amount:21.57, category:'misc' },
    { date:'2026-04-07', description:'chipotle', amount:9.96, category:'dining-out' },
    { date:'2026-04-06', description:'huey', amount:10.73, category:'dining-out' },
    { date:'2026-04-05', description:'panda', amount:15.77, category:'dining-out' },
    { date:'2026-04-04', description:'gas', amount:48.09, category:'gas' },
    { date:'2026-04-04', description:'shake and brownie', amount:9.12, category:'coffee-drinks' },
    { date:'2026-04-03', description:'Ice cream', amount:5.42, category:'coffee-drinks' },
    { date:'2026-04-02', description:'Break', amount:0.79, category:'dining-out' },
    { date:'2026-04-02', description:'Tip money', amount:20.0, category:'other-income' },
    { date:'2026-04-02', description:'Money from dad', amount:135.0, category:'other-income' },
    { date:'2026-04-01', description:'Interest esrned', amount:6.11, category:'other-income' },
    { date:'2026-04-01', description:'Paycheck', amount:717.68, category:'paycheck' },
    { date:'2026-04-01', description:'Cigars', amount:27.6, category:'misc' },
    { date:'2026-03-31', description:'Coffee', amount:7.16, category:'coffee-drinks' },
    { date:'2026-03-28', description:'food during weekend', amount:65.49, category:'dining-out' },
    { date:'2026-03-28', description:'gass', amount:33.15, category:'gas' },
    { date:'2026-03-27', description:'coffee and drinks', amount:23.86, category:'coffee-drinks' },
    { date:'2026-03-26', description:'textbook', amount:176.7, category:'misc' },
    { date:'2026-03-25', description:'charging dads car', amount:19.92, category:'misc' },
    { date:'2026-03-24', description:'a list', amount:1.05, category:'subscriptions' },
    { date:'2026-03-24', description:'package shipment for dad', amount:72.55, category:'misc' },
    { date:'2026-03-24', description:'chipotle', amount:9.32, category:'dining-out' },
    { date:'2026-03-23', description:'gassy', amount:44.57, category:'gas' },
    { date:'2026-03-22', description:'deodorant', amount:14.9, category:'hygiene' },
    { date:'2026-03-22', description:'final say hoodie', amount:49.3, category:'clothing' },
    { date:'2026-03-22', description:'arizona', amount:1.12, category:'coffee-drinks' },
    { date:'2026-03-22', description:'culvers', amount:13.72, category:'dining-out' },
    { date:'2026-03-22', description:'chipotle', amount:9.96, category:'dining-out' },
    { date:'2026-03-20', description:'blizzard', amount:5.34, category:'coffee-drinks' },
    { date:'2026-03-20', description:'moes', amount:12.77, category:'dining-out' },
    { date:'2026-03-20', description:'oil change', amount:102.7, category:'car-maintenance' },
    { date:'2026-03-20', description:'haircut', amount:45.5, category:'hygiene' },
    { date:'2026-03-18', description:'march tithes', amount:227.59, category:'tithes' },
    { date:'2026-03-18', description:'paycheck', amount:1246.88, category:'paycheck' },
    { date:'2026-03-18', description:'brainrot', amount:24.99, category:'subscriptions' },
    { date:'2026-03-17', description:'Chilis', amount:27.19, category:'dining-out' },
    { date:'2026-03-17', description:'gas', amount:48.0, category:'gas' },
    { date:'2026-03-17', description:'food', amount:6.15, category:'dining-out' },
    { date:'2026-03-17', description:'lobos', amount:7.4, category:'coffee-drinks' },
    { date:'2026-03-16', description:'helping lisa move', amount:100.0, category:'other-income' },
    { date:'2026-03-16', description:'coffee', amount:4.46, category:'coffee-drinks' },
    { date:'2026-03-16', description:'chatgpt', amount:20.0, category:'subscriptions' },
    { date:'2026-03-15', description:'whata shake', amount:6.79, category:'coffee-drinks' },
    { date:'2026-03-14', description:'whoopie cake', amount:3.18, category:'dining-out' },
    { date:'2026-03-14', description:'gas', amount:35.82, category:'gas' },
    { date:'2026-03-14', description:'foxtail', amount:7.16, category:'coffee-drinks' },
    { date:'2026-03-14', description:'mickey ds', amount:13.29, category:'dining-out' },
    { date:'2026-03-13', description:'tuition', amount:333.18, category:'misc' },
    { date:'2026-03-13', description:'breaky', amount:0.09, category:'dining-out' },
    { date:'2026-03-12', description:'new gym tag', amount:3.0, category:'misc' },
    { date:'2026-03-12', description:'spotify', amount:7.88, category:'subscriptions' },
    { date:'2026-03-11', description:'breaky', amount:0.09, category:'dining-out' },
    { date:'2026-03-09', description:'gas', amount:41.92, category:'gas' },
    { date:'2026-03-09', description:'food', amount:9.36, category:'dining-out' },
    { date:'2026-03-09', description:'API qzip', amount:143.76, category:'clothing' },
    { date:'2026-03-08', description:'maple street', amount:11.7, category:'dining-out' },
    { date:'2026-03-04', description:'Paycheck', amount:1026.63, category:'paycheck' },
    { date:'2026-03-03', description:'Chipyole', amount:9.43, category:'dining-out' },
    { date:'2026-03-02', description:'Gas', amount:32.8, category:'gas' },
    { date:'2026-03-01', description:'chipotle', amount:11.5, category:'dining-out' },
    { date:'2026-02-28', description:'Food', amount:0.68, category:'dining-out' },
    { date:'2026-02-27', description:'Groceries', amount:51.54, category:'groceries' },
    { date:'2026-02-27', description:'New hampers', amount:40.0, category:'misc' },
    { date:'2026-02-27', description:'Panera', amount:14.25, category:'dining-out' },
    { date:'2026-02-27', description:'Jhills diaper and wipes party', amount:29.37, category:'misc' },
    { date:'2026-02-26', description:'Dad paying me back', amount:53.0, category:'other-income' },
    { date:'2026-02-26', description:'TRIPLE DIPPER', amount:22.99, category:'dining-out' },
    { date:'2026-02-26', description:'Resume builder', amount:0.99, category:'misc' },
    { date:'2026-02-26', description:'Tithes', amount:157.64, category:'tithes' },
    { date:'2026-02-26', description:'Mickey ds', amount:7.13, category:'dining-out' },
    { date:'2026-02-26', description:'Breakfast break', amount:0.3, category:'dining-out' },
    { date:'2026-02-25', description:'Wake merch', amount:11.9, category:'clothing' },
    { date:'2026-02-25', description:'Breakfast', amount:0.3, category:'dining-out' },
    { date:'2026-02-24', description:'Oh hey', amount:6.92, category:'coffee-drinks' },
    { date:'2026-02-24', description:'Gas', amount:35.06, category:'gas' },
    { date:'2026-02-23', description:'break food', amount:0.09, category:'dining-out' },
    { date:'2026-02-23', description:'huey', amount:10.73, category:'dining-out' },
    { date:'2026-02-22', description:'drinks at tacos and tequila', amount:13.95, category:'coffee-drinks' },
    { date:'2026-02-22', description:'tacos and tequila', amount:25.0, category:'dining-out' },
    { date:'2026-02-22', description:'fries for the burches', amount:19.98, category:'misc' },
    { date:'2026-02-19', description:'Millers', amount:26.3, category:'dining-out' },
    { date:'2026-02-18', description:'Paycheck', amount:876.57, category:'paycheck' },
    { date:'2026-02-18', description:'Percy jasckson set', amount:47.87, category:'misc' },
    { date:'2026-02-17', description:'hot dogs for mom and dad', amount:52.04, category:'misc' },
    { date:'2026-02-17', description:'cash deposit', amount:149.0, category:'other-income' },
    { date:'2026-02-17', description:'Voice lessons', amount:200.0, category:'misc' },
    { date:'2026-02-17', description:'oh hey coffee', amount:6.92, category:'coffee-drinks' },
    { date:'2026-02-16', description:'gassy', amount:31.82, category:'gas' },
    { date:'2026-02-16', description:'chat gpt', amount:20.0, category:'subscriptions' },
    { date:'2026-02-15', description:'chips and queso', amount:10.49, category:'groceries' },
    { date:'2026-02-15', description:'kingsmen', amount:15.0, category:'misc' },
    { date:'2026-02-14', description:'lovebird', amount:13.27, category:'dining-out' },
    { date:'2026-02-13', description:'haircut', amount:45.5, category:'hygiene' },
    { date:'2026-02-12', description:'card interest', amount:16.08, category:'misc' },
    { date:'2026-02-12', description:'parkig', amount:1.35, category:'misc' },
    { date:'2026-02-12', description:'spotify', amount:6.75, category:'subscriptions' },
    { date:'2026-02-10', description:'unite merch', amount:35.0, category:'clothing' },
    { date:'2026-02-10', description:'craft and common coffee', amount:6.45, category:'coffee-drinks' },
    { date:'2026-02-10', description:'craft and common sandwich', amount:9.0, category:'dining-out' },
    { date:'2026-02-10', description:'kfc saucy', amount:14.25, category:'dining-out' },
    { date:'2026-02-10', description:'quittr', amount:19.99, category:'subscriptions' },
    { date:'2026-02-09', description:'audible?', amount:14.95, category:'misc' },
    { date:'2026-02-09', description:'post gym milkshake', amount:5.21, category:'coffee-drinks' },
    { date:'2026-02-08', description:'chipotle', amount:5.86, category:'dining-out' },
    { date:'2026-02-05', description:'frosty', amount:4.46, category:'dining-out' },
    { date:'2026-02-05', description:'Breaky', amount:0.09, category:'dining-out' },
    { date:'2026-02-04', description:'candy for fundraising kids', amount:2.0, category:'misc' },
    { date:'2026-02-04', description:'depop shipping bags', amount:20.0, category:'misc' },
    { date:'2026-02-04', description:'sustain pedal', amount:9.05, category:'misc' },
    { date:'2026-02-04', description:'paycheck', amount:699.81, category:'paycheck' },
    { date:'2026-02-04', description:'groceries for mom', amount:77.0, category:'misc' },
    { date:'2026-02-04', description:'poster board for depop', amount:2.0, category:'misc' },
    { date:'2026-02-04', description:'Coffee', amount:1.92, category:'coffee-drinks' },
    { date:'2026-02-03', description:'laundry freshener for mom', amount:20.2, category:'misc' },
    { date:'2026-02-03', description:'depop thrifting', amount:20.14, category:'misc' },
    { date:'2026-02-03', description:'mom paying me back', amount:40.0, category:'other-income' },
    { date:'2026-02-02', description:'gloves and hand sanitizer for thrifting', amount:10.0, category:'misc' },
    { date:'2026-02-02', description:'deodorant', amount:55.04, category:'hygiene' },
    { date:'2026-02-02', description:'chilis', amount:22.99, category:'dining-out' },
    { date:'2026-02-02', description:'Poker 🃏', amount:7.5, category:'other-income' },
    { date:'2026-02-01', description:'interest', amount:4.14, category:'other-income' },
    { date:'2026-02-01', description:'february tithes', amount:78.59, category:'tithes' },
    { date:'2026-02-01', description:'Chipotle', amount:13.37, category:'dining-out' },
    { date:'2026-02-01', description:'Gas', amount:31.85, category:'gas' },
    { date:'2026-01-30', description:'millers', amount:34.78, category:'dining-out' },
    { date:'2026-01-29', description:'Breaky', amount:0.09, category:'dining-out' },
    { date:'2026-01-28', description:'parking ticket', amount:30.5, category:'misc' },
    { date:'2026-01-28', description:'Tea and honey', amount:8.97, category:'groceries' },
    { date:'2026-01-28', description:'Water', amount:33.0, category:'misc' },
    { date:'2026-01-27', description:'korean garlic bread at haan', amount:8.98, category:'dining-out' },
    { date:'2026-01-27', description:'haan coffee', amount:7.0, category:'coffee-drinks' },
    { date:'2026-01-26', description:'gassy gas', amount:32.25, category:'gas' },
    { date:'2026-01-24', description:'food at two towers', amount:25.45, category:'dining-out' },
    { date:'2026-01-24', description:'icee at return of the king', amount:8.55, category:'coffee-drinks' },
    { date:'2026-01-24', description:'panera with deca', amount:7.44, category:'dining-out' },
    { date:'2026-01-23', description:'Post gym treat', amount:4.68, category:'coffee-drinks' },
    { date:'2026-01-23', description:'', amount:0.09, category:'dining-out' },
    { date:'2026-01-22', description:'lotr Tickets', amount:51.88, category:'misc' },
    { date:'2026-01-21', description:'', amount:10.89, category:'dining-out' },
    { date:'2026-01-21', description:'Dessert', amount:5.8, category:'dining-out' },
    { date:'2026-01-21', description:'Paycheck', amount:601.85, category:'paycheck' },
    { date:'2026-01-20', description:'Parking', amount:0.85, category:'misc' },
    { date:'2026-01-20', description:'Bynx', amount:5.66, category:'coffee-drinks' },
    { date:'2026-01-20', description:'Mom paid me back', amount:50.0, category:'other-income' },
    { date:'2026-01-19', description:'Kaplan Refund', amount:49.0, category:'other-income' },
    { date:'2026-01-19', description:'gassy', amount:31.86, category:'gas' },
    { date:'2026-01-19', description:'lunch', amount:0.09, category:'dining-out' },
    { date:'2026-01-18', description:'Publix for bible study lunch', amount:18.6, category:'dining-out' },
    { date:'2026-01-18', description:'post wake baco bell', amount:6.59, category:'dining-out' },
    { date:'2026-01-18', description:'pre kids starbs', amount:7.19, category:'coffee-drinks' },
    { date:'2026-01-17', description:'Satuli', amount:8.51, category:'dining-out' },
    { date:'2026-01-17', description:'foxtail wallet', amount:20.0, category:'coffee-drinks' },
    { date:'2026-01-16', description:'movie refund', amount:30.88, category:'other-income' },
    { date:'2026-01-16', description:'meds for mom', amount:35.48, category:'misc' },
    { date:'2026-01-16', description:'starbs for mom', amount:10.22, category:'misc' },
    { date:'2026-01-16', description:'bread for mom', amount:7.49, category:'misc' },
    { date:'2026-01-16', description:'chipotle', amount:3.83, category:'dining-out' },
    { date:'2026-01-15', description:'publix?', amount:20.42, category:'misc' },
    { date:'2026-01-15', description:'kaplan 2x', amount:98.0, category:'misc' },
    { date:'2026-01-15', description:'overdraft', amount:35.0, category:'misc' },
    { date:'2026-01-14', description:'Coffee for Micah', amount:3.99, category:'misc' },
    { date:'2026-01-14', description:'Deo and mouth wash', amount:5.36, category:'hygiene' },
    { date:'2026-01-14', description:'Chatgpt', amount:20.0, category:'subscriptions' },
    { date:'2026-01-14', description:'Macrofactor', amount:71.99, category:'subscriptions' },
    { date:'2026-01-14', description:'Spotify', amount:6.75, category:'subscriptions' },
    { date:'2026-01-14', description:'Deeply stroopwafel', amount:7.46, category:'coffee-drinks' },
    { date:'2026-01-14', description:'Bread for mom', amount:7.49, category:'misc' },
    { date:'2026-01-14', description:'Wednys for annaclaire', amount:11.66, category:'misc' },
    { date:'2026-01-14', description:'Wendys', amount:12.0, category:'dining-out' },
    { date:'2026-01-14', description:'Panda panda panda i got broads in atlanta', amount:10.97, category:'dining-out' },
    { date:'2026-01-13', description:'Post work lunch', amount:4.21, category:'dining-out' },
    { date:'2026-01-13', description:'Tix for bryan’s game', amount:9.0, category:'misc' },
    { date:'2026-01-12', description:'Gassy gas', amount:30.4, category:'gas' },
    { date:'2026-01-12', description:'Paying micah back for passion', amount:35.0, category:'vacation' },
    { date:'2026-01-12', description:'Soup and juice for mom', amount:32.88, category:'misc' },
    { date:'2026-01-12', description:'Rest of food', amount:0.68, category:'dining-out' },
    { date:'2026-01-11', description:'Five guys for annaclaire', amount:18.0, category:'misc' },
    { date:'2026-01-11', description:'Five guys', amount:18.18, category:'dining-out' },
    { date:'2026-01-10', description:'Gas station drink', amount:6.39, category:'coffee-drinks' },
    { date:'2026-01-10', description:'Gas money from AnnaClaire', amount:25.0, category:'other-income' },
    { date:'2026-01-10', description:'Protein coffee', amount:7.19, category:'coffee-drinks' },
    { date:'2026-01-10', description:'Gas', amount:27.22, category:'gas' },
    { date:'2026-01-09', description:'Basically nothing', amount:0.09, category:'dining-out' },
    { date:'2026-01-08', description:'Paycheck', amount:182.85, category:'paycheck' },
    { date:'2026-01-07', description:'Coffee for annaclaire', amount:7.39, category:'misc' },
    { date:'2026-01-07', description:'Henrique and Daniel’s gas money', amount:116.0, category:'other-income' },
    { date:'2026-01-07', description:'Nate’s gas money', amount:58.0, category:'other-income' },
    { date:'2026-01-07', description:'Passion roadtrip', amount:58.0, category:'gas' },
    { date:'2026-01-07', description:'Food for mom', amount:10.69, category:'misc' },
    { date:'2026-01-07', description:'Haircut', amount:45.0, category:'hygiene' },
    { date:'2026-01-06', description:'Mom paying me back', amount:10.0, category:'other-income' },
    { date:'2026-01-06', description:'Aldis', amount:74.13, category:'groceries' },
    { date:'2026-01-04', description:'Gas station snacks', amount:5.65, category:'dining-out' },
    { date:'2026-01-04', description:'Newks', amount:18.06, category:'dining-out' },
    { date:'2026-01-03', description:'Whata', amount:16.42, category:'dining-out' },
    { date:'2026-01-03', description:'In n out x2', amount:15.64, category:'dining-out' },
    { date:'2026-01-03', description:'Coffee', amount:9.65, category:'coffee-drinks' },
    { date:'2026-01-03', description:'Breakfast sandwich', amount:12.0, category:'dining-out' },
    { date:'2026-01-02', description:'Coffee', amount:10.2, category:'coffee-drinks' },
    { date:'2026-01-02', description:'JUMBO DOGS', amount:24.34, category:'dining-out' },
    { date:'2026-01-02', description:'Iced coffee', amount:9.17, category:'coffee-drinks' },
    { date:'2026-01-02', description:'Breakfast pretzel', amount:9.34, category:'dining-out' },
    { date:'2026-01-02', description:'December tithes', amount:97.02, category:'tithes' },
    { date:'2026-01-01', description:'Passion merch', amount:102.84, category:'clothing' },
    { date:'2026-01-01', description:'Clear bag', amount:7.58, category:'misc' },
    { date:'2026-01-01', description:'Hutchins!!', amount:41.51, category:'dining-out' },
    { date:'2026-01-01', description:'Pens for journaling', amount:5.27, category:'misc' },
    { date:'2026-06-10', description:'mcdonalds', amount:8.17, category:'dining-out' },
    { date:'2026-06-10', description:'gas', amount:10.0, category:'gas' },
    { date:'2026-06-10', description:'foxtail', amount:3.13, category:'coffee-drinks' },
    { date:'2026-06-11', description:'chick fil a', amount:15.71, category:'dining-out' },
    { date:'2026-06-11', description:'hat', amount:15.0, category:'clothing' },
    { date:'2026-06-11', description:'haircut', amount:45.5, category:'hygiene' },
    { date:'2026-06-11', description:'gas', amount:38.55, category:'gas' },
    { date:'2026-06-11', description:'krispy kreme', amount:16.49, category:'misc' },
    { date:'2026-06-12', description:'ajs', amount:12.64, category:'dining-out' },
    { date:'2026-06-13', description:'chick fil a', amount:12.77, category:'dining-out' },
    { date:'2026-06-12', description:'chick fil a', amount:15.07, category:'dining-out' },
  ];
  function seedBudgetTransactions(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.budgetSeeded) return;
    if(!state.budgetTransactions.length){
      state.budgetTransactions = SEED_BUDGET_TRANSACTIONS.map(t => Object.assign({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7)
      }, t));
    }
    state.seedFlags.budgetSeeded = true;
    save();
  }

  // One-time seed data pulled from uploaded Statistics course assignments.
  // Only inserted once (tracked via state.seedFlags) so re-opening the app
  // doesn't duplicate them if you've since edited or deleted any.
  const SEED_STATISTICS_TASKS = [
    { dueDate:'2026-08-28', text:'Sections 1.1 & 1.2: Classifying and Storing Data' },
    { dueDate:'2026-08-28', text:'My Math Lab Registration' },
    { dueDate:'2026-09-04', text:'Section 1.5: Collecting Data to Understand Causality' },
    { dueDate:'2026-09-04', text:'Sections 1.3 & 1.4: Investigating Data & Organizing Categorical Data' },
    { dueDate:'2026-09-11', text:'Chapter 1 QUIZ' },
    { dueDate:'2026-09-11', text:'Sections 2.1-2: Visualizing Variation in Numerical Data - Summarizing Important Features' },
    { dueDate:'2026-09-18', text:'Chapter 2 QUIZ' },
    { dueDate:'2026-09-18', text:'Sections 2.3-4: Visualizing Variation in Categorical Variables - Summarizing Categorical Variables' },
    { dueDate:'2026-09-18', text:'Section 2.5: Interpreting Graphs' },
    { dueDate:'2026-09-25', text:'Section 3.1: Summaries for Symmetric Distributions' },
    { dueDate:'2026-09-25', text:'Section 3.2: What is Unusual - The Empirical Rule and Z-scores' },
    { dueDate:'2026-09-25', text:'Section 3.3: Summaries for Skewed Distributions' },
    { dueDate:'2026-10-02', text:'Chapter 3 QUIZ' },
    { dueDate:'2026-10-02', text:'Section 3.4: Comparing Measures of Center' },
    { dueDate:'2026-10-02', text:'Section 3.5: Using Boxplots for Displaying Summaries' },
    { dueDate:'2026-10-09', text:'Section 4.1: Visualizing Variability with a Scatterplot' },
    { dueDate:'2026-10-09', text:'Section 4.2: Measuring Strength of Association with Correlation' },
    { dueDate:'2026-10-16', text:'Chapter 4 QUIZ' },
    { dueDate:'2026-10-16', text:'Section 4.3: Modeling Linear Trends' },
    { dueDate:'2026-10-16', text:'Section 4.4: Evaluating the Linear Model' },
    { dueDate:'2026-10-23', text:'Midterm EXAM' },
    { dueDate:'2026-10-23', text:'Midterm REVIEW' },
    { dueDate:'2026-10-30', text:'Section 6.1: Modeling Random Events' },
    { dueDate:'2026-10-30', text:'Section 5.2: Basics of Probability' },
    { dueDate:'2026-11-06', text:'Chapter 6 QUIZ' },
    { dueDate:'2026-11-06', text:'Section 6.2: Part 1 - The Normal Model' },
    { dueDate:'2026-11-06', text:'Section 6.2: Part 2 - The Normal Model' },
    { dueDate:'2026-11-13', text:'Section 7.1: Learning about the World through Surveys' },
    { dueDate:'2026-11-13', text:'Section 7.2: Measuring the Quality of a Survey' },
    { dueDate:'2026-11-13', text:'Section 7.3: The Central Limit Theorem for Sample Proportions' },
    { dueDate:'2026-11-20', text:'Chapter 7 QUIZ' },
    { dueDate:'2026-11-20', text:'Section 7.4: Estimating the Population Proportion with Confidence Intervals' },
    { dueDate:'2026-11-20', text:'Section 7.5: Comparing Two Population Proportions with Confidence Intervals' },
    { dueDate:'2026-11-24', text:'Section 8.1: The Essential Ingredients for Hypothesis Testing' },
    { dueDate:'2026-11-24', text:'Section 8.2: Hypothesis Testing in Four Steps' },
    { dueDate:'2026-12-04', text:'Chapter 8 QUIZ' },
    { dueDate:'2026-12-04', text:'Section 8.3: Hypothesis Tests in Detail' },
    { dueDate:'2026-12-04', text:'Section 8.4: Comparing Proportions from Two Populations' },
    { dueDate:'2026-12-11', text:'Final EXAM' },
    { dueDate:'2026-12-11', text:'Chapter 9 QUIZ' },
    { dueDate:'2026-12-11', text:'Section 9.1: Sample Means of Random Samples' },
    { dueDate:'2026-12-11', text:'Section 9.2: The Central Limit Theorem for Sample Means' },
    { dueDate:'2026-12-11', text:'Section 9.3: Answering Questions about the Mean of a Population' },
    { dueDate:'2026-12-11', text:'Section 9.4: Hypothesis Testing for Means' },
    { dueDate:'2026-12-11', text:'Sections 9.5 & 9.6: Comparing Two Population Means & Overview of Analyzing Means' },
    { dueDate:'2026-12-11', text:'Final REVIEW' },
  ];

  const SEED_SPEECH_TASKS = [
    { dueDate:'2026-08-28', text:'Test Knowledge - Start here' },
    { dueDate:'2026-08-31', text:'Test Knowledge: Syllabus Assignment' },
    { dueDate:'2026-08-31', text:'Test Knowledge: Calendar Assignment' },
    { dueDate:'2026-08-31', text:'Test Knowledge: Impact on My Life' },
    { dueDate:'2026-09-04', text:'Test Knowledge – Key Terms' },
    { dueDate:'2026-09-04', text:'Test Knowledge - Listening' },
    { dueDate:'2026-09-04', text:'Test Knowledge - Context' },
    { dueDate:'2026-09-07', text:'Test Knowledge – Phases of Speech Development' },
    { dueDate:'2026-09-11', text:'Test Knowledge – Speech One Context' },
    { dueDate:'2026-09-11', text:'Invention Part 1' },
    { dueDate:'2026-09-11', text:'Invention Part 2' },
    { dueDate:'2026-09-11', text:'Managing Environmental Context (Discussion Board)' },
    { dueDate:'2026-09-18', text:'Official Speech 1 Specific Purpose and Thesis' },
    { dueDate:'2026-09-21', text:'Test Knowledge – Informal Research' },
    { dueDate:'2026-09-21', text:'Responses: Managing Environmental Context' },
    { dueDate:'2026-09-25', text:'First Attempt - Informal Research Notes' },
    { dueDate:'2026-09-28', text:'Second Attempt - Informal Research Notes' },
    { dueDate:'2026-09-28', text:'Test Knowledge – Organization' },
    { dueDate:'2026-09-28', text:'Practice: Assess Outline Structure' },
    { dueDate:'2026-09-28', text:'Assess Speech Organization' },
    { dueDate:'2026-10-02', text:'Outline Body – Thesis and Main Points' },
    { dueDate:'2026-10-05', text:'Outline – Main Points and 7-Step' },
    { dueDate:'2026-10-05', text:'Test Knowledge - Delivery' },
    { dueDate:'2026-10-05', text:'Test Knowledge – Note Cards' },
    { dueDate:'2026-10-05', text:'Test Knowledge - Practice' },
    { dueDate:'2026-10-09', text:"Submit first set of speaker's notes" },
    { dueDate:'2026-10-12', text:'Practice Log' },
    { dueDate:'2026-10-12', text:'TEST ONE' },
    { dueDate:'2026-10-15', text:'Record Speech One video & get YouTube URL' },
    { dueDate:'2026-10-16', text:'Deadline to submit final Speech One outline and URL' },
    { dueDate:'2026-10-19', text:'Post Speech One to Discussion Board' },
    { dueDate:'2026-10-23', text:'Test Knowledge: Speech Two Context' },
    { dueDate:'2026-10-26', text:'Speech One Discussion Board (responses)' },
    { dueDate:'2026-10-26', text:'Submit Speech Two Specific Purpose and Thesis' },
    { dueDate:'2026-10-26', text:'Test Knowledge: Formal Research' },
    { dueDate:'2026-10-26', text:'Test Knowledge: Formal Research Documentation' },
    { dueDate:'2026-10-30', text:'Submit Formal Research Notes – First Source Only' },
    { dueDate:'2026-11-02', text:'Submit Formal Research Notes – First, Second, Third Sources' },
    { dueDate:'2026-11-02', text:'Test Knowledge: Presentation Aids' },
    { dueDate:'2026-11-02', text:'Test Knowledge: Listening Critically' },
    { dueDate:'2026-11-06', text:'Rough Draft Outline' },
    { dueDate:'2026-11-09', text:'Submit images of two presentation aids' },
    { dueDate:'2026-11-13', text:'Submit final Speech Two outline, documentation, sources, URL' },
    { dueDate:'2026-11-16', text:'Post Speech Two to Discussion Board' },
    { dueDate:'2026-11-16', text:'TEST TWO' },
    { dueDate:'2026-11-20', text:'Test Knowledge - Persuasion' },
    { dueDate:'2026-11-20', text:'Test Knowledge - ELM' },
    { dueDate:'2026-11-23', text:'Test Knowledge - Toulmin' },
    { dueDate:'2026-11-23', text:'Speech Two Discussion Board (responses)' },
    { dueDate:'2026-11-23', text:'Speech Three Specific Purpose and Thesis' },
    { dueDate:'2026-11-30', text:'Submit logic plan / audience analysis' },
    { dueDate:'2026-12-07', text:'Submit final Speech Three outline, documentation, sources, URL' },
    { dueDate:'2026-12-08', text:'Post Speech Three to Discussion Board' },
    { dueDate:'2026-12-09', text:'Deadline for submitting a late speech' },
    { dueDate:'2026-12-11', text:'Speech 4 Discussion Board' },
  ];

  const SEED_ACCOUNTING_TASKS = [
    { dueDate:'2026-08-25', text:'REQUIRED - Introduce Yourself Online Students!' },
    { dueDate:'2026-08-30', text:'Challenge 1-A' },
    { dueDate:'2026-08-30', text:'Challenge 1-B' },
    { dueDate:'2026-09-04', text:'Canvas Journal/Worksheet Exercise Chapters 1' },
    { dueDate:'2026-09-04', text:'Canvas Journal/Worksheet Exercise Chapters 2' },
    { dueDate:'2026-09-06', text:'Challenge 2-A' },
    { dueDate:'2026-09-06', text:'Challenge 2-B' },
    { dueDate:'2026-09-16', text:'Ch2 SmartBook' },
    { dueDate:'2026-09-16', text:'Ch3 SmartBook' },
    { dueDate:'2026-09-16', text:'Challenge 3-A' },
    { dueDate:'2026-09-16', text:'Challenge 3-B' },
    { dueDate:'2026-09-16', text:'SmartBook Chapter 1' },
    { dueDate:'2026-09-16', text:'Unit Test Ch 1, 2 and 3' },
    { dueDate:'2026-09-16', text:'Canvas Journal/Worksheet Chapter 3' },
    { dueDate:'2026-09-23', text:'Canvas Journal/Worksheet Chapter 4' },
    { dueDate:'2026-09-27', text:'Challenge 4-A' },
    { dueDate:'2026-09-27', text:'Challenge 4-B' },
    { dueDate:'2026-10-04', text:'Challenge 5-A' },
    { dueDate:'2026-10-04', text:'Challenge 5-B' },
    { dueDate:'2026-10-12', text:'Unit Test 2 Ch 4, 5 and 6' },
    { dueDate:'2026-10-12', text:'Ch4 SmartBook' },
    { dueDate:'2026-10-12', text:'Ch5 SmartBook' },
    { dueDate:'2026-10-12', text:'Ch6 SmartBook' },
    { dueDate:'2026-10-12', text:'Challenge 6-A' },
    { dueDate:'2026-10-12', text:'Challenge 6-B' },
    { dueDate:'2026-10-25', text:'Challenge 7-A' },
    { dueDate:'2026-10-25', text:'Challenge 7-B' },
    { dueDate:'2026-11-02', text:'Unit Test 3 Ch 7, 8 and 9' },
    { dueDate:'2026-11-02', text:'Ch7 SmartBook' },
    { dueDate:'2026-11-02', text:'Ch8 SmartBook' },
    { dueDate:'2026-11-02', text:'Ch9 SmartBook' },
    { dueDate:'2026-11-02', text:'Challenge 8-A' },
    { dueDate:'2026-11-02', text:'Challenge 8-B' },
    { dueDate:'2026-11-02', text:'Challenge 9-A' },
    { dueDate:'2026-11-02', text:'Challenge 9-B' },
    { dueDate:'2026-11-30', text:'Unit Test 4 Ch 10, 11 and 12' },
    { dueDate:'2026-11-30', text:'Ch10 SmartBook' },
    { dueDate:'2026-11-30', text:'Ch11 SmartBook' },
    { dueDate:'2026-11-30', text:'Ch12 SmartBook' },
    { dueDate:'2026-11-30', text:'Challenge 10-A' },
    { dueDate:'2026-11-30', text:'Challenge 10-B' },
    { dueDate:'2026-11-30', text:'Challenge 11-A' },
    { dueDate:'2026-11-30', text:'Challenge 11-B' },
    { dueDate:'2026-11-30', text:'Challenge 12-A' },
    { dueDate:'2026-11-30', text:'Challenge 12-B' },
    { dueDate:'2026-12-07', text:"Final Exam 2071 (Proctorio disabled) - One Attempt, Can't submit late" },
  ];

  const SEED_MACRO_TASKS = [
    { dueDate:'2026-08-30', text:'Adaptive Assignment: Fundamentals' },
    { dueDate:'2026-08-30', text:'Connect Master 2.0 Assignment' },
    { dueDate:'2026-08-30', text:'Connect without SmartBook Orientation Videos' },
    { dueDate:'2026-08-30', text:'First Week Quiz' },
    { dueDate:'2026-08-30', text:'Fundamentals: English Videos' },
    { dueDate:'2026-09-04', text:'Quiz 1' },
    { dueDate:'2026-09-06', text:'Adaptive Assignment: Market Failures' },
    { dueDate:'2026-09-06', text:'Bonus Chapter: The Economics of Pandemics' },
    { dueDate:'2026-09-06', text:'Market Failures: English Videos' },
    { dueDate:'2026-09-11', text:'Quiz 2' },
    { dueDate:'2026-09-13', text:'Adaptive Assignment: Institutions and the Marketplace' },
    { dueDate:'2026-09-13', text:'Adaptive Assignment: Public Finance' },
    { dueDate:'2026-09-13', text:'Institutions and the Marketplace: English Videos' },
    { dueDate:'2026-09-13', text:'Public Finance: English Videos' },
    { dueDate:'2026-09-18', text:'Quiz 3' },
    { dueDate:'2026-09-20', text:'Adaptive Assignment: International Finance' },
    { dueDate:'2026-09-20', text:'Adaptive Assignment: International Trade' },
    { dueDate:'2026-09-20', text:'Homework 1' },
    { dueDate:'2026-09-20', text:'International Finance: English Videos' },
    { dueDate:'2026-09-20', text:'International Trade: English Videos' },
    { dueDate:'2026-09-20', text:'Practice Using Honorlock with This Quiz' },
    { dueDate:'2026-09-23', text:'Exam One Extra Credit' },
    { dueDate:'2026-09-27', text:'Exam 1' },
    { dueDate:'2026-10-02', text:'Quiz 4' },
    { dueDate:'2026-10-04', text:'Adaptive Assignment: Demand' },
    { dueDate:'2026-10-04', text:'Adaptive Assignment: Supply' },
    { dueDate:'2026-10-04', text:'Demand: English Videos' },
    { dueDate:'2026-10-04', text:'Supply: English Videos' },
    { dueDate:'2026-10-09', text:'Quiz 5' },
    { dueDate:'2026-10-11', text:'Adaptive Assignment: Market Efficiency' },
    { dueDate:'2026-10-11', text:'Adaptive Assignment: Market Equilibrium and Policy' },
    { dueDate:'2026-10-11', text:'Homework 2' },
    { dueDate:'2026-10-11', text:'Market Efficiency: English Videos' },
    { dueDate:'2026-10-11', text:'Market Equilibrium and Policy: English Videos' },
    { dueDate:'2026-10-18', text:'Exam 2' },
    { dueDate:'2026-10-21', text:'Exam Two Extra Credit' },
    { dueDate:'2026-10-23', text:'Quiz 6' },
    { dueDate:'2026-10-25', text:'Adaptive Assignment: Economic Growth' },
    { dueDate:'2026-10-25', text:'Adaptive Assignment: Measuring Output and Income' },
    { dueDate:'2026-10-25', text:'Economic Growth: English Videos' },
    { dueDate:'2026-10-25', text:'Measuring Output and Income: English Videos' },
    { dueDate:'2026-10-30', text:'Quiz 7' },
    { dueDate:'2026-11-01', text:'Adaptive Assignment: Business Cycles, Unemployment, and Inflation' },
    { dueDate:'2026-11-01', text:'Business Cycles, Unemployment, and Inflation: English Videos' },
    { dueDate:'2026-11-06', text:'Quiz 8' },
    { dueDate:'2026-11-08', text:'Adaptive Assignment: Aggregate Demand and Supply' },
    { dueDate:'2026-11-08', text:'Aggregate Demand and Aggregate Supply: English Videos' },
    { dueDate:'2026-11-13', text:'Quiz 9' },
    { dueDate:'2026-11-15', text:'Adaptive Assignment: Competing Views in Macroeconomic Theory' },
    { dueDate:'2026-11-15', text:'Competing Views in Macroeconomic Theory: English Videos' },
    { dueDate:'2026-11-20', text:'Quiz 10' },
    { dueDate:'2026-11-22', text:'Adaptive Assignment: Aggregate Expenditures Model' },
    { dueDate:'2026-11-22', text:'Adaptive Assignment: Fiscal Policy' },
    { dueDate:'2026-11-22', text:'Aggregate Expenditures Model: English Videos' },
    { dueDate:'2026-11-22', text:'Fiscal Policy: English Videos' },
    { dueDate:'2026-11-22', text:'Homework 3' },
    { dueDate:'2026-11-30', text:'Adaptive Assignment: Monetary Policy' },
    { dueDate:'2026-11-30', text:'Adaptive Assignment: Money' },
    { dueDate:'2026-11-30', text:'Monetary Policy: English Videos' },
    { dueDate:'2026-11-30', text:'Money: English Videos' },
    { dueDate:'2026-12-02', text:'Final Exam Extra Credit' },
    { dueDate:'2026-12-07', text:'Final Exam' },
  ];

  const DEFAULT_TASK_DURATIONS = {
    'final exam': 120,
    'exam': 90,
    'unit test': 60,
    'quiz': 20,
    'homework': 60,
    'smartbook': 15,
    'adaptive assignment': 30,
    'english videos': 20,
    'challenge': 20,
    'journal': 25,
    'worksheet': 25,
    'discussion board': 20,
    'outline': 45,
    'practice log': 15,
    'test knowledge': 15,
    'debate': 30,
    'invention': 30,
    'speech': 45,
    '__default__': 30
  };

  let state = load();

  function seedStatisticsTasks(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.statistics) return;
    SEED_STATISTICS_TASKS.forEach(t => {
      state.tasks.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        text: t.text,
        category: 'school',
        subcategory: 'Statistics',
        dueDate: t.dueDate,
        done: false
      });
    });
    state.seedFlags.statistics = true;
    save();
  }
  seedStatisticsTasks();

  function seedSpeechTasks(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.speech) return;
    SEED_SPEECH_TASKS.forEach(t => {
      state.tasks.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        text: t.text,
        category: 'school',
        subcategory: 'Speech',
        dueDate: t.dueDate,
        done: false
      });
    });
    state.seedFlags.speech = true;
    save();
  }
  seedSpeechTasks();

  function seedAccountingTasks(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.accounting) return;
    SEED_ACCOUNTING_TASKS.forEach(t => {
      state.tasks.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        text: t.text,
        category: 'school',
        subcategory: 'Managerial Accounting',
        dueDate: t.dueDate,
        done: false
      });
    });
    state.seedFlags.accounting = true;
    save();
  }
  seedAccountingTasks();

  function seedMacroTasks(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.macro) return;
    SEED_MACRO_TASKS.forEach(t => {
      state.tasks.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        text: t.text,
        category: 'school',
        subcategory: 'Macroeconomics',
        dueDate: t.dueDate,
        done: false
      });
    });
    state.seedFlags.macro = true;
    save();
  }
  seedMacroTasks();

  // One-off tasks added directly by request (not tied to a syllabus).
  // Each has its own id so appending new ones later never re-adds old ones.
  const SEED_MISC_TASKS = [
    { id:'ask-rose-work-aug31', text:'Ask Rose to work on Wednesday', category:'personal', dueDate:'2026-08-31' },
    { id:'app-backend-work-sep3', text:'Work on backend for schedule app', category:'personal', dueDate:'2026-09-03',
      notes:'Email integration, push notifications, and cross-device sync (so data carries over between laptop and work computer)' },
  ];
  function seedMiscTasks(){
    if(!state.seedFlags) state.seedFlags = {};
    if(!state.seedFlags.miscDone) state.seedFlags.miscDone = [];
    let added = false;
    SEED_MISC_TASKS.forEach(t => {
      if(state.seedFlags.miscDone.includes(t.id)) return;
      state.tasks.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        text: t.text,
        category: t.category,
        subcategory: t.subcategory || '',
        dueDate: t.dueDate,
        priority: t.priority || 'normal',
        notes: t.notes || '',
        done: false
      });
      state.seedFlags.miscDone.push(t.id);
      added = true;
    });
    if(added) save();
  }
  seedMiscTasks();

  // One-off dated events added directly by request (not recurring weekly).
  // Each has its own id so appending new ones later never re-adds old ones.
  const SEED_MISC_EVENTS = [
    { id:'fantasy-draft-aug30', date:'2026-08-30', time:'18:30', text:'Fantasy Football Draft', category:'personal' },
    { id:'fantasy-draft-aug31', date:'2026-08-31', time:'20:00', text:'Fantasy Football Draft', category:'personal' },
  ];
  function seedMiscEvents(){
    if(!state.seedFlags) state.seedFlags = {};
    if(!state.seedFlags.miscEventsDone) state.seedFlags.miscEventsDone = [];
    let added = false;
    SEED_MISC_EVENTS.forEach(e => {
      if(state.seedFlags.miscEventsDone.includes(e.id)) return;
      if(!state.datedEvents[e.date]) state.datedEvents[e.date] = [];
      state.datedEvents[e.date].push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        time: e.time,
        text: e.text,
        category: e.category
      });
      state.seedFlags.miscEventsDone.push(e.id);
      added = true;
    });
    if(added) save();
  }
  seedMiscEvents();

  // Point-value backfill for the four seeded classes — pulled from the
  // original syllabus/grades screenshots. Patches any existing task whose
  // text matches exactly and that doesn't already have points set, once.
  const POINTS_BACKFILL = {
  "Statistics": {
    "Sections 1.1 & 1.2: Classifying and Storing Data": 25,
    "My Math Lab Registration": 10,
    "Section 1.5: Collecting Data to Understand Causality": 21,
    "Sections 1.3 & 1.4: Investigating Data & Organizing Categorical Data": 17,
    "Chapter 1 QUIZ": 96,
    "Sections 2.1-2: Visualizing Variation in Numerical Data - Summarizing Important Features": 39,
    "Chapter 2 QUIZ": 108,
    "Sections 2.3-4: Visualizing Variation in Categorical Variables - Summarizing Categorical Variables": 19,
    "Section 2.5: Interpreting Graphs": 10,
    "Section 3.1: Summaries for Symmetric Distributions": 20,
    "Section 3.2: What is Unusual - The Empirical Rule and Z-scores": 16,
    "Section 3.3: Summaries for Skewed Distributions": 11,
    "Chapter 3 QUIZ": 111,
    "Section 3.4: Comparing Measures of Center": 13,
    "Section 3.5: Using Boxplots for Displaying Summaries": 14,
    "Section 4.1: Visualizing Variability with a Scatterplot": 11,
    "Section 4.2: Measuring Strength of Association with Correlation": 17,
    "Chapter 4 QUIZ": 111,
    "Section 4.3: Modeling Linear Trends": 22,
    "Section 4.4: Evaluating the Linear Model": 20,
    "Midterm EXAM": 150,
    "Midterm REVIEW": 45,
    "Section 6.1: Modeling Random Events": 15,
    "Section 5.2: Basics of Probability": 11,
    "Chapter 6 QUIZ": 111,
    "Section 6.2: Part 1 - The Normal Model": 23,
    "Section 6.2: Part 2 - The Normal Model": 29,
    "Section 7.1: Learning about the World through Surveys": 21,
    "Section 7.2: Measuring the Quality of a Survey": 17,
    "Section 7.3: The Central Limit Theorem for Sample Proportions": 15,
    "Chapter 7 QUIZ": 111,
    "Section 7.4: Estimating the Population Proportion with Confidence Intervals": 18,
    "Section 7.5: Comparing Two Population Proportions with Confidence Intervals": 13,
    "Section 8.1: The Essential Ingredients for Hypothesis Testing": 23,
    "Section 8.2: Hypothesis Testing in Four Steps": 22,
    "Chapter 8 QUIZ": 117,
    "Section 8.3: Hypothesis Tests in Detail": 15,
    "Section 8.4: Comparing Proportions from Two Populations": 14,
    "Final EXAM": 240,
    "Chapter 9 QUIZ": 91,
    "Section 9.1: Sample Means of Random Samples": 13,
    "Section 9.2: The Central Limit Theorem for Sample Means": 14,
    "Section 9.3: Answering Questions about the Mean of a Population": 16,
    "Section 9.4: Hypothesis Testing for Means": 13,
    "Sections 9.5 & 9.6: Comparing Two Population Means & Overview of Analyzing Means": 25,
    "Final REVIEW": 50
  },
  "Speech": {
    "Test Knowledge - Start here": 1,
    "Test Knowledge: Syllabus Assignment": 1,
    "Test Knowledge: Calendar Assignment": 1,
    "Test Knowledge: Impact on My Life": 1,
    "Test Knowledge \u2013 Key Terms": 1,
    "Test Knowledge - Listening": 1,
    "Test Knowledge - Context": 1,
    "Test Knowledge \u2013 Phases of Speech Development": 1,
    "Test Knowledge \u2013 Speech One Context": 1,
    "Invention Part 1": 1,
    "Invention Part 2": 1,
    "Managing Environmental Context (Discussion Board)": 4,
    "Official Speech 1 Specific Purpose and Thesis": 1,
    "Test Knowledge \u2013 Informal Research": 1,
    "Responses: Managing Environmental Context": 2,
    "First Attempt - Informal Research Notes": 1,
    "Second Attempt - Informal Research Notes": 1,
    "Test Knowledge \u2013 Organization": 1,
    "Practice: Assess Outline Structure": 1,
    "Assess Speech Organization": 1,
    "Outline Body \u2013 Thesis and Main Points": 1,
    "Outline \u2013 Main Points and 7-Step": 1,
    "Test Knowledge - Delivery": 1,
    "Test Knowledge \u2013 Note Cards": 1,
    "Test Knowledge - Practice": 1,
    "Submit first set of speaker's notes": 1,
    "Practice Log": 1,
    "TEST ONE": 5,
    "Record Speech One video & get YouTube URL": 0,
    "Deadline to submit final Speech One outline and URL": 10,
    "Post Speech One to Discussion Board": 1,
    "Test Knowledge: Speech Two Context": 1,
    "Speech One Discussion Board (responses)": 4,
    "Submit Speech Two Specific Purpose and Thesis": 1,
    "Test Knowledge: Formal Research": 1,
    "Test Knowledge: Formal Research Documentation": 1,
    "Submit Formal Research Notes \u2013 First Source Only": 1,
    "Submit Formal Research Notes \u2013 First, Second, Third Sources": 1,
    "Test Knowledge: Presentation Aids": 1,
    "Test Knowledge: Listening Critically": 1,
    "Rough Draft Outline": 1,
    "Submit images of two presentation aids": 1,
    "Submit final Speech Two outline, documentation, sources, URL": 15,
    "Post Speech Two to Discussion Board": 1,
    "TEST TWO": 5,
    "Test Knowledge - Persuasion": 1,
    "Test Knowledge - ELM": 1,
    "Test Knowledge - Toulmin": 1,
    "Speech Two Discussion Board (responses)": 4,
    "Speech Three Specific Purpose and Thesis": 1,
    "Submit logic plan / audience analysis": 1,
    "Submit final Speech Three outline, documentation, sources, URL": 15,
    "Post Speech Three to Discussion Board": 1,
    "Deadline for submitting a late speech": 0,
    "Speech 4 Discussion Board": 4
  },
  "Managerial Accounting": {
    "REQUIRED - Introduce Yourself Online Students!": 5,
    "Challenge 1-A": 12.5,
    "Challenge 1-B": 12.5,
    "Canvas Journal/Worksheet Exercise Chapters 1": 20,
    "Canvas Journal/Worksheet Exercise Chapters 2": 10,
    "Challenge 2-A": 12.5,
    "Challenge 2-B": 12.5,
    "Ch2 SmartBook": 5,
    "Ch3 SmartBook": 4,
    "Challenge 3-A": 12.5,
    "Challenge 3-B": 12.5,
    "SmartBook Chapter 1": 5,
    "Unit Test Ch 1, 2 and 3": 75,
    "Canvas Journal/Worksheet Chapter 3": 15,
    "Canvas Journal/Worksheet Chapter 4": 15,
    "Challenge 4-A": 12.5,
    "Challenge 4-B": 12.5,
    "Challenge 5-A": 12.5,
    "Challenge 5-B": 12.5,
    "Unit Test 2 Ch 4, 5 and 6": 75,
    "Ch4 SmartBook": 4,
    "Ch5 SmartBook": 4,
    "Ch6 SmartBook": 4,
    "Challenge 6-A": 12.5,
    "Challenge 6-B": 12.5,
    "Challenge 7-A": 12.5,
    "Challenge 7-B": 12.5,
    "Unit Test 3 Ch 7, 8 and 9": 75,
    "Ch7 SmartBook": 4,
    "Ch8 SmartBook": 4,
    "Ch9 SmartBook": 4,
    "Challenge 8-A": 12.5,
    "Challenge 8-B": 12.5,
    "Challenge 9-A": 12.5,
    "Challenge 9-B": 12.5,
    "Unit Test 4 Ch 10, 11 and 12": 75,
    "Ch10 SmartBook": 4,
    "Ch11 SmartBook": 4,
    "Ch12 SmartBook": 4,
    "Challenge 10-A": 12.5,
    "Challenge 10-B": 12.5,
    "Challenge 11-A": 12.5,
    "Challenge 11-B": 12.5,
    "Challenge 12-A": 12.5,
    "Challenge 12-B": 12.5,
    "Final Exam 2071 (Proctorio disabled) - One Attempt, Can't submit late": 200
  },
  "Macroeconomics": {
    "Adaptive Assignment: Fundamentals": 100,
    "Connect Master 2.0 Assignment": 10,
    "Connect without SmartBook Orientation Videos": 30,
    "First Week Quiz": 10,
    "Fundamentals: English Videos": 190,
    "Quiz 1": 100,
    "Adaptive Assignment: Market Failures": 100,
    "Bonus Chapter: The Economics of Pandemics": 100,
    "Market Failures: English Videos": 100,
    "Quiz 2": 100,
    "Adaptive Assignment: Institutions and the Marketplace": 100,
    "Adaptive Assignment: Public Finance": 100,
    "Institutions and the Marketplace: English Videos": 60,
    "Public Finance: English Videos": 70,
    "Quiz 3": 100,
    "Adaptive Assignment: International Finance": 100,
    "Adaptive Assignment: International Trade": 100,
    "Homework 1": 500,
    "International Finance: English Videos": 70,
    "International Trade: English Videos": 130,
    "Practice Using Honorlock with This Quiz": 3,
    "Exam One Extra Credit": 25,
    "Exam 1": 500,
    "Quiz 4": 100,
    "Adaptive Assignment: Demand": 100,
    "Adaptive Assignment: Supply": 100,
    "Demand: English Videos": 80,
    "Supply: English Videos": 60,
    "Quiz 5": 100,
    "Adaptive Assignment: Market Efficiency": 100,
    "Adaptive Assignment: Market Equilibrium and Policy": 100,
    "Homework 2": 400,
    "Market Efficiency: English Videos": 90,
    "Market Equilibrium and Policy: English Videos": 110,
    "Exam 2": 500,
    "Exam Two Extra Credit": 25,
    "Quiz 6": 100,
    "Adaptive Assignment: Economic Growth": 100,
    "Adaptive Assignment: Measuring Output and Income": 100,
    "Economic Growth: English Videos": 40,
    "Measuring Output and Income: English Videos": 110,
    "Quiz 7": 100,
    "Adaptive Assignment: Business Cycles, Unemployment, and Inflation": 100,
    "Business Cycles, Unemployment, and Inflation: English Videos": 100,
    "Quiz 8": 100,
    "Adaptive Assignment: Aggregate Demand and Supply": 100,
    "Aggregate Demand and Aggregate Supply: English Videos": 150,
    "Quiz 9": 100,
    "Adaptive Assignment: Competing Views in Macroeconomic Theory": 100,
    "Competing Views in Macroeconomic Theory: English Videos": 10,
    "Quiz 10": 100,
    "Adaptive Assignment: Aggregate Expenditures Model": 100,
    "Adaptive Assignment: Fiscal Policy": 100,
    "Aggregate Expenditures Model: English Videos": 120,
    "Fiscal Policy: English Videos": 110,
    "Homework 3": 500,
    "Adaptive Assignment: Monetary Policy": 100,
    "Adaptive Assignment: Money": 100,
    "Monetary Policy: English Videos": 140,
    "Money: English Videos": 130,
    "Final Exam Extra Credit": 60,
    "Final Exam": 1000
  }
};
  function backfillTaskPoints(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.pointsBackfilled) return;
    let changed = false;
    state.tasks.forEach(t => {
      if(t.category !== 'school') return;
      const table = POINTS_BACKFILL[t.subcategory];
      if(!table) return;
      if(t.points !== null && t.points !== undefined) return;
      if(Object.prototype.hasOwnProperty.call(table, t.text)){
        t.points = table[t.text];
        changed = true;
      }
    });
    state.seedFlags.pointsBackfilled = true;
    if(changed) save();
  }
  backfillTaskPoints();

  // Default goals, seeded once — after that the person's own edits (adding,
  // removing, renaming) are left alone on every future load.
  const DEFAULT_DAILY_GOALS = [
    { id:'bible-reading', name:'Bible reading' },
    { id:'walk-goal',     name:'Walk' },
    { id:'book-reading',  name:'Book reading' },
    { id:'make-bed',      name:'Make my bed' },
    { id:'screentime',    name:'Under 6 hrs screentime' },
  ];
  const DEFAULT_WEEKLY_GOALS = [
    { id:'gym-goal',      name:'Gym',         target:5 }, // manually tracked — no longer auto-linked to calendar check-ins
    { id:'book-study',    name:'Book Study',  target:1 },
    { id:'record-video',  name:'Record a video', target:1 },
  ];
  function seedDefaultGoals(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.goalsSeeded) return;
    if(!state.dailyGoals.length) state.dailyGoals = DEFAULT_DAILY_GOALS.map(g => Object.assign({}, g));
    if(!state.weeklyGoals.length) state.weeklyGoals = DEFAULT_WEEKLY_GOALS.map(g => Object.assign({}, g));
    state.seedFlags.goalsSeeded = true;
    save();
  }
  seedDefaultGoals();

  function seedGoalReflectionHabit(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.goalReflectionHabitAdded) return;
    if(!state.weeklyGoals.some(g => g.id === 'goal-reflection')){
      state.weeklyGoals.push({ id:'goal-reflection', name:'Weekly Goal Reflection', target:1, auto:'GoalReflection' });
    }
    state.seedFlags.goalReflectionHabitAdded = true;
    save();
  }
  seedGoalReflectionHabit();

  function migrateGymHabitToManual(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.gymHabitManual) return;
    const gymGoal = state.weeklyGoals.find(g => g.id === 'gym-goal');
    if(gymGoal && gymGoal.auto) delete gymGoal.auto;
    state.seedFlags.gymHabitManual = true;
    save();
  }
  migrateGymHabitToManual();

  // Fall Split — seeded once from what's known so far. Mon/Tue/Wed start
  // with their named strength lift; the rest is left empty for the full
  // split to be added via the Fitness tab's + button.
  const DEFAULT_FITNESS_SPLIT = {
    startDate: '2026-08-31',
    endDate: '2026-10-19',
    days: {
      Mon: { focus:'Chest', exercises:[
        { id:'ex-db-bench',          name:'DB Bench Press',       type:'strength',    sets:4, repMin:4,  repMax:6 },
        { id:'ex-cable-press-around',name:'Cable Press Around',   type:'hypertrophy', sets:3, repMin:12, repMax:15 },
        { id:'ex-incline-db-press',  name:'Incline DB Press',     type:'hypertrophy', sets:3, repMin:8,  repMax:10 },
        { id:'ex-pec-deck',          name:'Pec Deck',             type:'hypertrophy', sets:3, repMin:10, repMax:12 },
        { id:'ex-cable-lat-raise',   name:'Cable Lateral Raise',  type:'accessory',   sets:3, repMin:12, repMax:15 },
      ]},
      Tue: { focus:'Back', exercises:[
        { id:'ex-bb-row',            name:'Barbell Row',          type:'strength',    sets:4, repMin:4,  repMax:6 },
        { id:'ex-sa-lat-pulldown',   name:'SA Lat Pulldown',      type:'hypertrophy', sets:3, repMin:8,  repMax:10 },
        { id:'ex-low-row-machine',   name:'Low Row Machine',      type:'hypertrophy', sets:3, repMin:10, repMax:12 },
        { id:'ex-cable-row',         name:'Cable Row',            type:'hypertrophy', sets:3, repMin:10, repMax:12 },
        { id:'ex-face-pull',         name:'Face Pull',            type:'accessory',   sets:3, repMin:12, repMax:15 },
        { id:'ex-rear-delt-fly',     name:'Rear Delt Fly',        type:'accessory',   sets:3, repMin:15, repMax:20 },
      ]},
      Wed: { focus:'Legs', exercises:[
        { id:'ex-pendulum-squat',    name:'Pendulum Squat',       type:'strength',    sets:4, repMin:4,  repMax:6 },
        { id:'ex-bulgarian-split',   name:'Bulgarian Split Squat',type:'hypertrophy', sets:3, repMin:8,  repMax:8 },
        { id:'ex-rdl',               name:'Romanian Deadlift',    type:'hypertrophy', sets:3, repMin:8,  repMax:10 },
        { id:'ex-ham-curl',          name:'Hamstring Curl',       type:'hypertrophy', sets:3, repMin:10, repMax:12 },
        { id:'ex-leg-extension',     name:'Leg Extension',        type:'hypertrophy', sets:3, repMin:12, repMax:15 },
        { id:'ex-calf-raise',        name:'Calf Raise',           type:'hypertrophy', sets:3, repMin:10, repMax:15 },
      ]},
      Thu: { focus:'Arms', exercises:[
        { id:'ex-oh-tricep-ext',     name:'Overhead Tricep Extension', type:'hypertrophy', sets:3, repMin:10, repMax:12 },
        { id:'ex-cable-pushdown',    name:'Cable Pushdown',       type:'hypertrophy', sets:3, repMin:10, repMax:12 },
        { id:'ex-cable-kickback',    name:'Cable Kickback',       type:'hypertrophy', sets:3, repMin:12, repMax:15 },
        { id:'ex-ez-curl',           name:'EZ Bar Curl',          type:'hypertrophy', sets:3, repMin:8,  repMax:10 },
        { id:'ex-hammer-curl',       name:'Hammer Curls',         type:'hypertrophy', sets:3, repMin:10, repMax:12 },
        { id:'ex-cable-curl',        name:'Cable Curl',           type:'hypertrophy', sets:3, repMin:12, repMax:15 },
      ]},
      Fri: { focus:'Accessory', exercises:[
        { id:'ex-machine-shoulder',  name:'Machine Shoulder Press', type:'accessory', sets:3, repMin:10, repMax:12 },
        { id:'ex-cable-y-raise',     name:'Cable Y-Raise',        type:'accessory',   sets:3, repMin:15, repMax:15 },
        { id:'ex-cable-crunch',      name:'Cable Crunch Machine', type:'accessory',   sets:3, repMin:12, repMax:15 },
        { id:'ex-hanging-leg-raise', name:'Hanging Leg Raise',    type:'accessory',   sets:3, repMin:12, repMax:15 },
      ]},
      Sat: { focus:'Rest', exercises:[] },
      Sun: { focus:'Rest', exercises:[] },
    }
  };
  function seedFitnessSplit(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.fitnessSplitSeeded) return;
    if(!state.fitnessSplit) state.fitnessSplit = JSON.parse(JSON.stringify(DEFAULT_FITNESS_SPLIT));
    state.seedFlags.fitnessSplitSeeded = true;
    save();
  }
  seedFitnessSplit();

  // Pulls in the full split from Notion (previously only had the 3 main
  // lifts stubbed in) plus the Week 1 Monday Chest session that was
  // already logged there, so nothing gets lost or re-typed.
  function importFallSplitFromNotion(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.fallSplitImported) return;
    if(state.fitnessSplit){
      state.fitnessSplit.days = JSON.parse(JSON.stringify(DEFAULT_FITNESS_SPLIT.days));
    }
    if(!state.workoutLogs['2026-08-31']) state.workoutLogs['2026-08-31'] = { exercises: {} };
    state.workoutLogs['2026-08-31'].exercises = Object.assign(state.workoutLogs['2026-08-31'].exercises || {}, {
      'ex-db-bench':           [{weight:90,reps:6},{weight:90,reps:6},{weight:90,reps:6},{weight:90,reps:6}],
      'ex-cable-press-around': [{weight:65,reps:15},{weight:65,reps:15},{weight:65,reps:15}],
      'ex-incline-db-press':   [{weight:75,reps:9},{weight:75,reps:8},{weight:75,reps:8}],
      'ex-pec-deck':           [{weight:100,reps:12},{weight:100,reps:12},{weight:100,reps:12}],
      'ex-cable-lat-raise':    [{weight:40,reps:15},{weight:40,reps:14},{weight:40,reps:''}],
    });
    state.workoutLogs['2026-08-31'].coachNotes = "DB press was difficult but I hit the top range of each. Could tell my chest was tired during incline DB at the end of those sets. Pec deck felt solid at 100 lbs — could've maybe done 110 but probably wouldn't have swept 12s, so I didn't want to push it first week.";
    state.seedFlags.fallSplitImported = true;
    save();
  }
  importFallSplitFromNotion();

  function markSaturdayRest(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.saturdayRestSet) return;
    if(state.fitnessSplit && state.fitnessSplit.days){
      state.fitnessSplit.days.Sat = { focus:'Rest', exercises:[] };
    }
    state.seedFlags.saturdayRestSet = true;
    save();
  }
  markSaturdayRest();

  seedBudgetTransactions();

  // "The Standard" — this app itself, as a project. Also migrates the
  // pre-existing "Work on backend" task so it appears grouped under this
  // project instead of sitting flat under Personal.
  function seedStandardProject(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.standardProjectSeeded) return;
    if(!state.projects.some(p => p.id === 'proj-the-standard')){
      state.projects.push({
        id: 'proj-the-standard',
        name: 'The Standard',
        category: 'personal',
        description: 'Building this all-in-one app',
        dueDate: null,
        status: 'active',
        pinned: true,
        milestones: [],
        notes: '',
        goalId: null
      });
    }
    const backendTask = state.tasks.find(t => t.text === 'Work on backend for schedule app' && t.category === 'personal' && !t.projectId);
    if(backendTask) backendTask.projectId = 'proj-the-standard';
    state.seedFlags.standardProjectSeeded = true;
    save();
  }
  seedStandardProject();
  seedJournalHabit();

  let weekAnchor = startOfWeek(new Date());
  let activeDay = new Date().getDay();
  let view = 'block';
  let currentSection = 'dashboard'; // 'dashboard' | 'calendar' | 'tasks' | 'lists' | 'habits' | 'longgoals' | 'fitness'
  let filterCats = new Set(CATEGORIES.map(c => c.id));
  let menuOpenForCat = null;
  let taskSubView = 'today'; // 'today' | 'upcoming'
  let expandedGroups = new Set(); // tracks which groups are open — everything starts closed
  let needsAttentionExpanded = false; // Dashboard's Needs Attention section — starts closed
  let calendarViewMonth = null;

  function startOfWeek(d){
    const s = new Date(d);
    s.setHours(0,0,0,0);
    s.setDate(s.getDate() - s.getDay());
    return s;
  }

  function pad2(n){ return String(n).padStart(2,'0'); }
  function toDateStr(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }
  function timeToMin(t){ const [h,m] = t.split(':').map(Number); return h*60+m; }
  function minToTime(min){ return pad2(Math.floor(min/60)) + ':' + pad2(min%60); }
  function dateFromStr(s){ const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
  function dayAbbrFromDateStr(s){ return DAYS[dateFromStr(s).getDay()]; }
  function todayStr(){ return toDateStr(new Date()); }

  function weekDates(){
    return DAYS.map((_, i) => {
      const d = new Date(weekAnchor);
      d.setDate(weekAnchor.getDate() + i);
      return d;
    });
  }

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed && parsed.items){
          if(!parsed.tasks) parsed.tasks = [];
          if(!parsed.workOff) parsed.workOff = {};
          if(!parsed.healthLog) parsed.healthLog = {};
          if(!parsed.seedFlags) parsed.seedFlags = {};
          if(!parsed.datedEvents) parsed.datedEvents = {};
          if(!parsed.taskDurations) parsed.taskDurations = Object.assign({}, DEFAULT_TASK_DURATIONS);
          if(!parsed.dailyGoals) parsed.dailyGoals = [];
          if(!parsed.weeklyGoals) parsed.weeklyGoals = [];
          if(!parsed.dailyGoalLog) parsed.dailyGoalLog = {};
          if(!parsed.weeklyGoalLog) parsed.weeklyGoalLog = {};
          if(!parsed.allDayEvents) parsed.allDayEvents = [];
          if(!parsed.lists) parsed.lists = [];
          if(!parsed.longTermGoals) parsed.longTermGoals = [];
          if(!parsed.fitnessSplit) parsed.fitnessSplit = null;
          if(!parsed.workoutLogs) parsed.workoutLogs = {};
          if(!parsed.budgetTransactions) parsed.budgetTransactions = [];
          if(!parsed.categoryBudgetLimits) parsed.categoryBudgetLimits = {};
          if(!parsed.projects) parsed.projects = [];
          if(!parsed.journalEntries) parsed.journalEntries = {};
          if(!parsed.energyLevels) parsed.energyLevels = {};
          return parsed;
        }
      }
    }catch(e){}
    const items = {};
    DAYS.forEach(d => items[d] = []);
    return {
      items, workOff: {}, tasks: [], healthLog: {}, seedFlags: {}, datedEvents: {},
      taskDurations: Object.assign({}, DEFAULT_TASK_DURATIONS),
      dailyGoals: [], weeklyGoals: [], dailyGoalLog: {}, weeklyGoalLog: {},
      allDayEvents: [], lists: [], longTermGoals: [],
      fitnessSplit: null, workoutLogs: {}, budgetTransactions: [], categoryBudgetLimits: {},
      projects: [], journalEntries: {}, energyLevels: {}
    };
  }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function fmtTime(t){
    let [h,m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12; if(h12 === 0) h12 = 12;
    return h12 + (m ? ':' + String(m).padStart(2,'0') : '') + ' ' + ap;
  }

  function fmtDate(dateStr){
    const [y,m,d] = dateStr.split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
  }

  function weekLabel(){
    const dates = weekDates();
    return 'Week of ' + dates[0].toLocaleDateString('en-US', { month:'short', day:'numeric' });
  }

  function blocksForDate(dayAbbr, dateStr){
    return RECURRING_BLOCKS.filter(b => b.day === dayAbbr)
      .filter(b => !b.startDate || dateStr >= b.startDate)
      .filter(b => !b.endDate || dateStr <= b.endDate)
      .filter(b => !(b.excludeDates && b.excludeDates.includes(dateStr)))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  /* ---------------- Auto-scheduling engine ---------------- */

  // Matches task text against saved keyword->minutes rules. Longest keyword
  // match wins (so "final exam" beats "exam"). Falls back to __default__.
  function guessDurationMinutes(text){
    const lower = text.toLowerCase();
    let bestKey = null;
    Object.keys(state.taskDurations).forEach(key => {
      if(key === '__default__') return;
      if(lower.includes(key.toLowerCase())){
        if(!bestKey || key.length > bestKey.length) bestKey = key;
      }
    });
    if(bestKey) return state.taskDurations[bestKey];
    return state.taskDurations['__default__'] || 30;
  }

  // Returns [start,end] minute ranges already occupied on a given date —
  // fixed recurring blocks (not marked off), weekly-recurring events, and
  // already-placed dated events.
  function getBusyRangesForDate(dateStr){
    const dayAbbr = dayAbbrFromDateStr(dateStr);
    const ranges = [];
    blocksForDate(dayAbbr, dateStr).forEach(b => {
      if(state.workOff[b.id + '_' + dateStr]) return;
      ranges.push([timeToMin(b.start), timeToMin(b.end)]);
    });
    state.items[dayAbbr].forEach(it => {
      const s = timeToMin(it.time);
      const e = it.endTime ? timeToMin(it.endTime) : s + 30;
      ranges.push([s, e]);
    });
    (state.datedEvents[dateStr] || []).forEach(it => {
      const s = timeToMin(it.time);
      const e = it.endTime ? timeToMin(it.endTime) : s + 30;
      ranges.push([s, e]);
    });
    return ranges;
  }

  // First open slot of the given duration within the visible hour window,
  // checked in 15-minute steps against the busy ranges.
  // Capacity-aware scheduling: stored energy preference by hour (0-23),
  // defaulting to 'medium' for anything not explicitly set.
  function getEnergyLevel(hour){
    return state.energyLevels[String(hour).padStart(2,'0')] || 'medium';
  }

  function rangeHasLowEnergy(startMin, endMin){
    const startHour = Math.floor(startMin / 60);
    const endHour = Math.ceil(endMin / 60);
    for(let h = startHour; h < endHour; h++){
      if(getEnergyLevel(h) === 'low') return true;
    }
    return false;
  }

  function findSlotForDuration(durationMin, busyRanges, avoidLowEnergy){
    const windowEnd = (END_HOUR + 1) * 60;
    for(let start = START_HOUR * 60; start + durationMin <= windowEnd; start += 15){
      const end = start + durationMin;
      const conflict = busyRanges.some(([s,e]) => start < e && end > s);
      if(conflict) continue;
      if(avoidLowEnergy && rangeHasLowEnergy(start, end)) continue;
      return { start, end };
    }
    return null;
  }

  function findLinkedEvent(taskId){
    for(const dateKey in state.datedEvents){
      const found = state.datedEvents[dateKey].find(it => it.linkedTaskId === taskId);
      if(found) return { dateStr: dateKey, event: found };
    }
    return null;
  }

  // Places pending, not-yet-scheduled tasks into open slots — tries the due
  // date first, then up to 3 days earlier (never before today, never after
  // the due date). Returns a summary for reporting back to the person.
  const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 };

  // Tries to place a single task into an open slot. Mutates state.datedEvents
  // and the task itself on success. Returns { placed, dateStr, duration } or
  // { placed: false }. Does not save() — caller decides when to persist.
  function attemptPlaceTask(t){
    const today = todayStr();
    const duration = guessDurationMinutes(t.text);
    const dueDate = dateFromStr(t.dueDate);

    // Search order: 2 days before due date, then 1 day before, then the
    // due date itself, then keep stepping further back (3, 4, 5...) if
    // none of those have room — capped so it doesn't search forever.
    const MAX_LOOKBACK = 14;
    const lookbackOrder = [2, 1, 0];
    for(let extra = 3; extra <= MAX_LOOKBACK; extra++) lookbackOrder.push(extra);

    const candidateDates = [];
    for(const lookback of lookbackOrder){
      const candidateDate = new Date(dueDate);
      candidateDate.setDate(dueDate.getDate() - lookback);
      const dateStr = toDateStr(candidateDate);
      if(dateStr >= today) candidateDates.push(dateStr);
    }

    // Pass 1: respect low-energy windows — try every candidate date before
    // ever placing something in one. Pass 2 (fallback): allow low-energy
    // hours if nothing else was open anywhere.
    for(const avoidLow of [true, false]){
      for(const dateStr of candidateDates){
        const busy = getBusyRangesForDate(dateStr);
        const slot = findSlotForDuration(duration, busy, avoidLow);
        if(slot){
          if(!state.datedEvents[dateStr]) state.datedEvents[dateStr] = [];
          state.datedEvents[dateStr].push({
            id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
            time: minToTime(slot.start),
            endTime: minToTime(slot.end),
            text: t.text,
            category: t.category,
            subcategory: t.subcategory,
            linkedTaskId: t.id
          });
          t.scheduled = true;
          return { placed: true, dateStr, duration, lowEnergy: !avoidLow && rangeHasLowEnergy(slot.start, slot.end) };
        }
      }
    }
    return { placed: false };
  }

  // Clears whatever slot a task currently has (if any) so it can be placed
  // again — used by both the batch scheduler's "reset" path and the
  // per-task Reschedule button.
  function clearTaskSchedule(t){
    const link = findLinkedEvent(t.id);
    if(link) state.datedEvents[link.dateStr] = state.datedEvents[link.dateStr].filter(e => e.id !== link.event.id);
    t.scheduled = false;
  }

  // Tasks due soon with nothing on the calendar for them yet — surfaced in
  // the Weekly Review so conflicts show up before the day arrives.
  function getAtRiskTasks(withinDays){
    const today = todayStr();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + (withinDays || 7));
    const horizonStr = toDateStr(horizon);
    return state.tasks
      .filter(t => !t.done && !t.scheduled && t.dueDate >= today && t.dueDate <= horizonStr)
      .sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  }

  /* ---------------- Health streaks & weekly stats (used by Weekly Review) ---------------- */

  // Consecutive days (walking back from today) a given Health block label was
  // marked done. Days it wasn't applicable (day off, out of date range, wrong
  // weekday) are skipped rather than breaking the streak; an unmarked *today*
  // doesn't break it either, since the day isn't over yet.
  function computeBlockStreak(label){
    let streak = 0;
    const cur = new Date();
    cur.setHours(0,0,0,0);
    for(let i = 0; i < 60; i++){
      const ds = toDateStr(cur);
      const dayAbbr = DAYS[cur.getDay()];
      const applicable = blocksForDate(dayAbbr, ds).filter(b => b.category === 'health' && b.label === label);
      if(applicable.length){
        const b = applicable[0];
        const off = !!state.workOff[b.id + '_' + ds];
        if(!off){
          const status = state.healthLog[b.id + '_' + ds];
          if(status === 'done'){ streak++; }
          else if(ds === todayStr() && !status){ /* today not logged yet — don't break */ }
          else { break; }
        }
      }
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  // Done/skipped/applicable counts for a Health block label across the
  // currently-viewed week (respects week navigation).
  function datesForWeekStart(startDateStr){
    const start = dateFromStr(startDateStr);
    return DAYS.map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }

  function weekStatsForLabel(label, dates){
    dates = dates || weekDates();
    let total = 0, done = 0, skipped = 0;
    dates.forEach(d => {
      const ds = toDateStr(d);
      const dayAbbr = DAYS[d.getDay()];
      const applicable = blocksForDate(dayAbbr, ds).filter(b => b.category === 'health' && b.label === label);
      if(!applicable.length) return;
      const b = applicable[0];
      if(state.workOff[b.id + '_' + ds]) return;
      total++;
      const status = state.healthLog[b.id + '_' + ds];
      if(status === 'done') done++;
      else if(status === 'skipped') skipped++;
    });
    return { total, done, skipped };
  }

  /* ---------------- Daily / weekly goals ---------------- */

  function isDailyGoalDone(goalId, dateStr){
    const goal = state.dailyGoals.find(g => g.id === goalId);
    if(goal && goal.auto === 'Journal'){
      const entry = state.journalEntries[dateStr];
      return !!(entry && entry.text && entry.text.trim().length > 0);
    }
    return !!state.dailyGoalLog[goalId + '_' + dateStr];
  }

  function toggleDailyGoal(goalId, dateStr){
    const key = goalId + '_' + dateStr;
    if(state.dailyGoalLog[key]) delete state.dailyGoalLog[key];
    else state.dailyGoalLog[key] = true;
    save();
  }

  // Consecutive days (walking back from today) a daily goal was checked off.
  // Today not yet checked doesn't break the streak — the day isn't over.
  function computeDailyGoalStreak(goalId){
    let streak = 0;
    const cur = new Date();
    cur.setHours(0,0,0,0);
    for(let i = 0; i < 90; i++){
      const ds = toDateStr(cur);
      if(isDailyGoalDone(goalId, ds)){ streak++; }
      else if(ds === todayStr()){ /* not logged yet today — don't break */ }
      else { break; }
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  // Fraction of days done within a given week's dates (only counts days up
  // to and including today, so future days don't drag the percentage down —
  // a fully past week naturally counts all 7).
  function weekStatsForDailyGoal(goalId, dates){
    dates = dates || weekDates();
    let total = 0, done = 0;
    const today = todayStr();
    dates.forEach(d => {
      const ds = toDateStr(d);
      if(ds > today) return;
      total++;
      if(isDailyGoalDone(goalId, ds)) done++;
    });
    return { total, done };
  }

  function weeklyGoalKey(goal, weekStartStr){ return goal.id + '_' + weekStartStr; }

  function getWeeklyGoalCount(goal, weekStartStr){
    weekStartStr = weekStartStr || toDateStr(weekDates()[0]);
    if(goal.auto === 'Gym') return weekStatsForLabel('Gym', datesForWeekStart(weekStartStr)).done;
    if(goal.auto === 'GoalReflection') return hasAnyGoalReflectionThisWeek(weekStartStr) ? 1 : 0;
    return state.weeklyGoalLog[weeklyGoalKey(goal, weekStartStr)] || 0;
  }

  function realCurrentWeekStart(){ return toDateStr(startOfWeek(new Date())); }

  function adjustWeeklyGoal(goal, delta){
    if(goal.auto) return; // auto-linked goals aren't manually adjustable
    const key = weeklyGoalKey(goal, realCurrentWeekStart());
    const cur = state.weeklyGoalLog[key] || 0;
    state.weeklyGoalLog[key] = Math.max(0, cur + delta);
    save();
  }

  // Goals section is intentionally independent of the Calendar section's
  // week/day navigation — it always reflects the real "today" and the real
  // current week, so it reads the same regardless of what you're browsing
  // to in Calendar.
  function renderHabitsSection(){
    const wrap = document.getElementById('habitsContent');
    wrap.innerHTML = '';
    const dateStr = todayStr();
    const weekStart = realCurrentWeekStart();

    if(!state.dailyGoals.length && !state.weeklyGoals.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'No habits set up yet — tap + to add your first one.';
      wrap.appendChild(empty);
      return;
    }

    if(state.dailyGoals.length){
      const title = document.createElement('div');
      title.className = 'task-section-title';
      title.style.cursor = 'default';
      title.innerHTML = '<span>Daily</span>';
      wrap.appendChild(title);

      const goalsBox = document.createElement('div');
      goalsBox.className = 'goals-box';
      state.dailyGoals.forEach(g => {
        const done = isDailyGoalDone(g.id, dateStr);
        const streak = computeDailyGoalStreak(g.id);
        const row = document.createElement('div');
        row.className = 'goal-daily-row' + (done ? ' done' : '');
        row.innerHTML = '<button class="goal-check">✓</button><span class="goal-name"></span><span class="goal-streak"></span><button class="goal-del">×</button>';
        row.querySelector('.goal-name').textContent = g.name;
        row.querySelector('.goal-streak').textContent = streak ? streak + '🔥' : '';
        row.querySelector('.goal-check').onclick = () => {
          if(g.auto === 'Journal'){ switchSection('journal'); return; }
          toggleDailyGoal(g.id, dateStr);
          renderAll();
        };
        row.querySelector('.goal-del').onclick = () => {
          state.dailyGoals = state.dailyGoals.filter(x => x.id !== g.id);
          save();
          renderAll();
        };
        goalsBox.appendChild(row);
      });
      wrap.appendChild(goalsBox);
    }

    if(state.weeklyGoals.length){
      const title = document.createElement('div');
      title.className = 'task-section-title';
      title.style.cursor = 'default';
      title.style.marginTop = state.dailyGoals.length ? '18px' : '0';
      title.innerHTML = '<span>Weekly</span>';
      wrap.appendChild(title);

      const goalsBox = document.createElement('div');
      goalsBox.className = 'goals-box';
      state.weeklyGoals.forEach(g => {
        const count = getWeeklyGoalCount(g, weekStart);
        const pct = Math.min(100, Math.round((count / g.target) * 100));
        const row = document.createElement('div');
        row.className = 'goal-weekly-row';
        row.innerHTML = `
          <div class="goal-weekly-top">
            <span class="goal-name">${escapeHtml(g.name)}</span>
            <span class="goal-weekly-count">${count}/${g.target}${g.auto ? ' · auto' : ''}</span>
            <button class="goal-del">×</button>
          </div>
          <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div>
          ${g.auto ? '' : '<div class="goal-weekly-btns"><button class="goal-adj minus">−</button><button class="goal-adj plus">+</button></div>'}
        `;
        if(!g.auto){
          row.querySelector('.minus').onclick = () => { adjustWeeklyGoal(g, -1); renderAll(); };
          row.querySelector('.plus').onclick = () => { adjustWeeklyGoal(g, 1); renderAll(); };
        }
        row.querySelector('.goal-del').onclick = () => {
          state.weeklyGoals = state.weeklyGoals.filter(x => x.id !== g.id);
          save();
          renderAll();
        };
        goalsBox.appendChild(row);
      });
      wrap.appendChild(goalsBox);
    }
  }

  function openAddHabitModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    let goalType = 'daily';

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Add a habit</div>
      <div class="view-toggle" id="goalTypeToggle" style="margin:0 0 14px">
        <button id="goalTypeDaily" class="active">Daily</button>
        <button id="goalTypeWeekly">Weekly</button>
      </div>
      <label>Name</label>
      <input type="text" id="goalName" placeholder="e.g. Stretch" maxlength="40">
      <div id="goalTargetField" style="display:none">
        <label>Target per week</label>
        <input type="number" id="goalTarget" min="1" step="1" value="1">
      </div>
      <div class="modal-actions">
        <button class="cancel" id="goalCancel">Cancel</button>
        <button class="save" id="goalSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    document.getElementById('goalTypeDaily').onclick = () => {
      goalType = 'daily';
      document.getElementById('goalTypeDaily').classList.add('active');
      document.getElementById('goalTypeWeekly').classList.remove('active');
      document.getElementById('goalTargetField').style.display = 'none';
    };
    document.getElementById('goalTypeWeekly').onclick = () => {
      goalType = 'weekly';
      document.getElementById('goalTypeWeekly').classList.add('active');
      document.getElementById('goalTypeDaily').classList.remove('active');
      document.getElementById('goalTargetField').style.display = 'block';
    };
    document.getElementById('goalCancel').onclick = closeModal;
    document.getElementById('goalSave').onclick = () => {
      const name = document.getElementById('goalName').value.trim();
      if(!name) return;
      const id = 'goal-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
      if(goalType === 'daily'){
        state.dailyGoals.push({ id, name });
      } else {
        const target = Math.max(1, parseInt(document.getElementById('goalTarget').value, 10) || 1);
        state.weeklyGoals.push({ id, name, target });
      }
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('goalName').focus(), 50);
  }

  /* ---------------- Lists ---------------- */

  let collapsedLists = new Set();

  // Resolves a list's link back to the live task/event object, so the tag
  // always shows current text (or "removed" if the linked item is gone).
  function resolveListLink(list){
    if(!list.linkType) return null;
    if(list.linkType === 'task'){
      const t = state.tasks.find(x => x.id === list.linkId);
      return t ? { label: t.text, kind: 'Task' } : { label: '(removed)', kind: 'Task' };
    }
    if(list.linkType === 'event'){
      if(list.linkDay){
        const it = (state.items[list.linkDay] || []).find(x => x.id === list.linkId);
        return it ? { label: it.text, kind: 'Event · ' + list.linkDay } : { label: '(removed)', kind: 'Event' };
      }
      if(list.linkDateStr){
        const it = (state.datedEvents[list.linkDateStr] || []).find(x => x.id === list.linkId);
        return it ? { label: it.text, kind: 'Event · ' + fmtDate(list.linkDateStr) } : { label: '(removed)', kind: 'Event' };
      }
    }
    return null;
  }

  function renderListsSection(){
    const wrap = document.getElementById('listsContent');
    wrap.innerHTML = '';

    if(!state.lists.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'No lists yet — tap + to create one (e.g. a grocery list).';
      wrap.appendChild(empty);
      return;
    }

    state.lists.forEach(list => {
      const collapsed = collapsedLists.has(list.id);
      const link = resolveListLink(list);
      const doneCount = list.items.filter(i => i.done).length;

      const card = document.createElement('div');
      card.className = 'list-card';

      const header = document.createElement('div');
      header.className = 'list-card-header' + (collapsed ? ' collapsed' : '');
      header.innerHTML = `
        <span class="chev">▾</span>
        <div class="list-card-title-wrap">
          <div class="list-card-name">${escapeHtml(list.name)}</div>
          <div class="list-card-meta">
            <span>${doneCount}/${list.items.length} checked</span>
            ${link ? '<span class="list-link-tag">🔗 ' + escapeHtml(link.kind) + ': ' + escapeHtml(link.label) + '</span>' : ''}
          </div>
        </div>
        <button class="list-card-del">×</button>
      `;
      header.querySelector('.list-card-del').onclick = (e) => {
        e.stopPropagation();
        state.lists = state.lists.filter(x => x.id !== list.id);
        save();
        renderAll();
      };
      header.addEventListener('click', () => {
        if(collapsedLists.has(list.id)) collapsedLists.delete(list.id);
        else collapsedLists.add(list.id);
        renderListsSection();
      });
      card.appendChild(header);

      if(!collapsed){
        const body = document.createElement('div');
        body.className = 'list-card-body';

        list.items.forEach(item => {
          const row = document.createElement('div');
          row.className = 'list-item-row' + (item.done ? ' done' : '');
          row.innerHTML = '<button class="list-item-check">✓</button><span class="list-item-text"></span><button class="list-item-del">×</button>';
          row.querySelector('.list-item-text').textContent = item.text;
          row.querySelector('.list-item-check').onclick = () => {
            item.done = !item.done;
            save();
            renderListsSection();
          };
          row.querySelector('.list-item-del').onclick = () => {
            list.items = list.items.filter(x => x.id !== item.id);
            save();
            renderListsSection();
          };
          body.appendChild(row);
        });

        const addRow = document.createElement('div');
        addRow.className = 'list-add-row';
        addRow.innerHTML = '<input type="text" placeholder="Add item…" maxlength="60"><button>Add</button>';
        const input = addRow.querySelector('input');
        const doAdd = () => {
          const text = input.value.trim();
          if(!text) return;
          list.items.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,7), text, done:false });
          save();
          renderListsSection();
        };
        addRow.querySelector('button').onclick = doAdd;
        input.addEventListener('keydown', e => { if(e.key === 'Enter') doAdd(); });
        body.appendChild(addRow);

        card.appendChild(body);
      }

      wrap.appendChild(card);
    });
  }

  function openAddListModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');

    // Build link options: pending tasks + this week's weekly events + this
    // week's dated events. Kept to "this week" for events so the dropdown
    // stays short rather than listing every event that ever existed.
    const taskOptions = state.tasks.filter(t => !t.done)
      .map(t => '<option value="task:' + t.id + '">Task: ' + escapeHtml(t.text) + '</option>').join('');
    let eventOptions = '';
    DAYS.forEach(d => {
      (state.items[d] || []).forEach(it => {
        eventOptions += '<option value="event:' + d + ':' + it.id + '">Event (' + d + '): ' + escapeHtml(it.text) + '</option>';
      });
    });
    weekDates().forEach(dt => {
      const ds = toDateStr(dt);
      (state.datedEvents[ds] || []).forEach(it => {
        eventOptions += '<option value="dated:' + ds + ':' + it.id + '">Event (' + fmtDate(ds) + '): ' + escapeHtml(it.text) + '</option>';
      });
    });

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">New list</div>
      <label>Name</label>
      <input type="text" id="listName" placeholder="e.g. Grocery List" maxlength="60">
      <label>Link to (optional)</label>
      <select id="listLink">
        <option value="">None</option>
        ${taskOptions ? '<optgroup label="Tasks">' + taskOptions + '</optgroup>' : ''}
        ${eventOptions ? '<optgroup label="Events (this week)">' + eventOptions + '</optgroup>' : ''}
      </select>
      <div class="modal-actions">
        <button class="cancel" id="listCancel">Cancel</button>
        <button class="save" id="listSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    document.getElementById('listCancel').onclick = closeModal;
    document.getElementById('listSave').onclick = () => {
      const name = document.getElementById('listName').value.trim();
      if(!name) return;
      const linkVal = document.getElementById('listLink').value;
      const list = { id: Date.now() + '-' + Math.random().toString(36).slice(2,7), name, items: [], linkType: null, linkId: null, linkDay: null, linkDateStr: null };
      if(linkVal){
        const parts = linkVal.split(':');
        if(parts[0] === 'task'){
          list.linkType = 'task'; list.linkId = parts[1];
        } else if(parts[0] === 'event'){
          list.linkType = 'event'; list.linkDay = parts[1]; list.linkId = parts[2];
        } else if(parts[0] === 'dated'){
          list.linkType = 'event'; list.linkDateStr = parts[1]; list.linkId = parts[2];
        }
      }
      state.lists.push(list);
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('listName').focus(), 50);
  }

  /* ---------------- Long-term Goals (Monthly/Quarterly/Yearly) ---------------- */

  const LG_TIMEFRAMES = [
    { id:'monthly',   label:'Monthly' },
    { id:'quarterly', label:'Quarterly' },
    { id:'yearly',    label:'Yearly' },
    { id:'custom',    label:'Custom Date' },
  ];

  // Has the person written anything in ANY long-term goal's weekly
  // reflection box this week? Feeds the auto-tracked "Weekly Goal
  // Reflection" habit.
  function hasAnyGoalReflectionThisWeek(weekStartStr){
    return state.longTermGoals.some(g => {
      const note = g.weeklyNotes && g.weeklyNotes[weekStartStr];
      return note && note.trim().length > 0;
    });
  }

  function renderLongGoalsSection(){
    const wrap = document.getElementById('longGoalsContent');
    wrap.innerHTML = '';
    const weekStart = realCurrentWeekStart();

    if(!state.longTermGoals.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'No goals yet — tap + to set a monthly, quarterly, yearly, or custom-date goal.';
      wrap.appendChild(empty);
      return;
    }

    LG_TIMEFRAMES.forEach(tf => {
      const goals = state.longTermGoals.filter(g => g.timeframe === tf.id);
      if(!goals.length) return;

      const title = document.createElement('div');
      title.className = 'lg-timeframe-title';
      title.textContent = tf.label;
      wrap.appendChild(title);

      goals.forEach(g => {
        const card = document.createElement('div');
        card.className = 'lg-card';
        const dateLine = (tf.id === 'custom' && g.targetDate) ? '<div class="proj-desc">Due ' + fmtDate(g.targetDate) + '</div>' : '';
        card.innerHTML = `
          <div class="lg-card-top">
            <div>
              <div class="lg-card-name">${escapeHtml(g.name)}</div>
              ${dateLine}
            </div>
            <button class="lg-card-del">×</button>
          </div>
          <label>This week's progress</label>
          <textarea placeholder="What did you do this week toward this goal?" rows="2"></textarea>
          <div class="lg-saved-tag">Saved</div>
        `;
        const textarea = card.querySelector('textarea');
        textarea.value = (g.weeklyNotes && g.weeklyNotes[weekStart]) || '';
        const savedTag = card.querySelector('.lg-saved-tag');
        textarea.addEventListener('blur', () => {
          if(!g.weeklyNotes) g.weeklyNotes = {};
          g.weeklyNotes[weekStart] = textarea.value.trim();
          save();
          savedTag.classList.add('show');
          setTimeout(() => savedTag.classList.remove('show'), 1500);
          renderHabitsSection(); // the auto-tracked reflection habit may have just changed
        });
        card.querySelector('.lg-card-del').onclick = () => {
          state.longTermGoals = state.longTermGoals.filter(x => x.id !== g.id);
          save();
          renderAll();
        };
        wrap.appendChild(card);
      });
    });
  }

  function openAddLongGoalModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    let timeframe = 'monthly';

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Add a goal</div>
      <div class="view-toggle" id="lgTimeframeToggle" style="margin:0 0 14px">
        <button id="lgMonthly" class="active">Monthly</button>
        <button id="lgQuarterly">Quarterly</button>
        <button id="lgYearly">Yearly</button>
        <button id="lgCustom">Custom</button>
      </div>
      <label>Name</label>
      <input type="text" id="lgName" placeholder="e.g. Read 12 books" maxlength="60">
      <div id="lgCustomDateField" style="display:none">
        <label>Target date</label>
        <input type="date" id="lgTargetDate" value="${todayStr()}">
      </div>
      <div class="modal-actions">
        <button class="cancel" id="lgCancel">Cancel</button>
        <button class="save" id="lgSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    const setTf = (tf, btnId) => {
      timeframe = tf;
      ['lgMonthly','lgQuarterly','lgYearly','lgCustom'].forEach(id => document.getElementById(id).classList.toggle('active', id === btnId));
      document.getElementById('lgCustomDateField').style.display = tf === 'custom' ? 'block' : 'none';
    };
    document.getElementById('lgMonthly').onclick = () => setTf('monthly', 'lgMonthly');
    document.getElementById('lgQuarterly').onclick = () => setTf('quarterly', 'lgQuarterly');
    document.getElementById('lgYearly').onclick = () => setTf('yearly', 'lgYearly');
    document.getElementById('lgCustom').onclick = () => setTf('custom', 'lgCustom');

    document.getElementById('lgCancel').onclick = closeModal;
    document.getElementById('lgSave').onclick = () => {
      const name = document.getElementById('lgName').value.trim();
      if(!name) return;
      const targetDate = timeframe === 'custom' ? (document.getElementById('lgTargetDate').value || todayStr()) : null;
      state.longTermGoals.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        name, timeframe, targetDate, weeklyNotes: {}
      });
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('lgName').focus(), 50);
  }

  /* ---------------- Dashboard ---------------- */

  // Scans forward from right now (today's remaining hours, then future
  // days) across fixed blocks, weekly events, and dated events to find
  // whatever's coming up next.
  function findNextEvent(){
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for(let i = 0; i < 14; i++){
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const ds = toDateStr(d);
      const dayAbbr = DAYS[d.getDay()];
      let candidates = [];
      blocksForDate(dayAbbr, ds).forEach(b => {
        if(!state.workOff[b.id + '_' + ds]) candidates.push({ time:b.start, endTime:b.end, text:b.label, category:b.category });
      });
      (state.items[dayAbbr] || []).forEach(it => candidates.push(it));
      (state.datedEvents[ds] || []).forEach(it => candidates.push(it));
      if(i === 0) candidates = candidates.filter(c => timeToMin(c.time) >= nowMin);
      if(candidates.length){
        candidates.sort((a,b) => timeToMin(a.time) - timeToMin(b.time));
        return { event: candidates[0], dateStr: ds, dayIndex: i };
      }
    }
    return null;
  }

  function renderDashboardSection(){
    const wrap = document.getElementById('dashboardContent');
    wrap.innerHTML = '';
    const today = todayStr();

    const heading = document.createElement('div');
    heading.className = 'section-label';
    heading.style.marginBottom = '14px';
    heading.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
    wrap.appendChild(heading);

    // Next up
    const nextTitle = document.createElement('div');
    nextTitle.className = 'task-section-title';
    nextTitle.style.cursor = 'default';
    nextTitle.innerHTML = '<span>Next up</span>';
    wrap.appendChild(nextTitle);

    const next = findNextEvent();
    if(next){
      const cat = catById[next.event.category] || CATEGORIES[0];
      const dayLabel = next.dayIndex === 0 ? 'Today' : next.dayIndex === 1 ? 'Tomorrow' : fmtDate(next.dateStr);
      const card = document.createElement('div');
      card.className = 'dash-next-card';
      card.style.setProperty('--accent-color', cat.color);
      card.innerHTML = `
        <div class="dash-next-time">${fmtTime(next.event.time)}${next.event.endTime ? '–' + fmtTime(next.event.endTime) : ''}</div>
        <div class="dash-next-text">${escapeHtml(next.event.text)}</div>
        <div class="dash-next-meta">${escapeHtml(dayLabel)} · ${cat.label}</div>
      `;
      wrap.appendChild(card);
    } else {
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'Nothing on the calendar in the next two weeks.';
      wrap.appendChild(empty);
    }

    // Upcoming — everything pending due within the next 7 days (including
    // anything already overdue), checkable right here. Covers today's tasks
    // too, so a separate "Due today" section would just duplicate this.
    const weekOut = new Date(); weekOut.setDate(weekOut.getDate() + 7);
    const weekOutStr = toDateStr(weekOut);
    const attnTasks = state.tasks.filter(t => !t.done && t.dueDate <= weekOutStr)
      .sort((a,b) => a.dueDate.localeCompare(b.dueDate));

    const attnHeader = document.createElement('div');
    attnHeader.className = 'dash-section-header';
    attnHeader.innerHTML = `
      <span class="dash-header-title"><span class="chev${needsAttentionExpanded ? '' : ' collapsed'}">▾</span> Upcoming (${attnTasks.length})</span>
      <span class="dash-header-arrow" id="attnGoTasks">Tasks →</span>
    `;
    attnHeader.querySelector('.dash-header-title').onclick = () => {
      needsAttentionExpanded = !needsAttentionExpanded;
      renderDashboardSection();
    };
    attnHeader.querySelector('#attnGoTasks').onclick = (e) => {
      e.stopPropagation();
      taskSubView = 'upcoming';
      switchSection('tasks');
    };
    wrap.appendChild(attnHeader);

    if(needsAttentionExpanded){
    if(!attnTasks.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'Nothing due in the next 7 days.';
      wrap.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'task-list';
      attnTasks.forEach(t => {
        const cat = catById[t.category] || CATEGORIES[0];
        const overdue = t.dueDate < today;
        const row = document.createElement('div');
        row.className = 'task-item';
        row.style.setProperty('--accent-color', cat.color);
        row.innerHTML = '<button class="task-check">✓</button><div class="task-body"><div class="task-txt"></div><div class="task-meta"></div></div>';
        row.querySelector('.task-txt').textContent = t.text;
        const meta = row.querySelector('.task-meta');
        meta.textContent = cat.label + (t.subcategory ? ' · ' + t.subcategory : '') + ' · ' + (overdue ? 'was due ' + fmtDate(t.dueDate) : (t.dueDate === today ? 'due today' : 'due ' + fmtDate(t.dueDate)));
        if(overdue) meta.classList.add('overdue');
        row.querySelector('.task-check').onclick = () => { t.done = true; save(); renderAll(); };
        list.appendChild(row);
      });
      wrap.appendChild(list);
    }
    }

    // Quick-nav grid — glanceable stats for everything else, tap to jump in
    const gridTitle = document.createElement('div');
    gridTitle.className = 'task-section-title';
    gridTitle.style.cursor = 'default';
    gridTitle.style.marginTop = '18px';
    gridTitle.innerHTML = '<span>More</span>';
    wrap.appendChild(gridTitle);

    const grid = document.createElement('div');
    grid.className = 'dash-grid';

    // Projects
    const activeProjects = state.projects.filter(p => p.status === 'active');
    let nextMilestone = null;
    activeProjects.forEach(p => {
      (p.milestones || []).filter(m => !m.done && m.targetDate).forEach(m => {
        if(!nextMilestone || m.targetDate < nextMilestone.targetDate) nextMilestone = { name: m.name, targetDate: m.targetDate };
      });
    });
    grid.appendChild(makeDashTile({
      color: '#5B8DEF',
      title: 'Projects',
      stat: activeProjects.length + ' active',
      sub: nextMilestone ? escapeHtml(nextMilestone.name) + ' · ' + fmtDate(nextMilestone.targetDate) : (state.projects.length ? 'No upcoming milestones' : 'No projects yet'),
      onClick: () => switchSection('projects')
    }));

    // Habits
    const dailyDone = state.dailyGoals.filter(g => isDailyGoalDone(g.id, today)).length;
    grid.appendChild(makeDashTile({
      color: '#3CBF8C',
      title: 'Habits',
      stat: dailyDone + '/' + state.dailyGoals.length,
      sub: 'done today',
      onClick: () => switchSection('habits')
    }));

    // Goals
    grid.appendChild(makeDashTile({
      color: '#B18CF2',
      title: 'Goals',
      stat: String(state.longTermGoals.length),
      sub: state.longTermGoals.length === 1 ? 'goal set' : 'goals set',
      onClick: () => switchSection('longgoals')
    }));

    // Lists
    const openItems = state.lists.reduce((s,l) => s + l.items.filter(i => !i.done).length, 0);
    grid.appendChild(makeDashTile({
      color: '#F2A93B',
      title: 'Lists',
      stat: String(state.lists.length),
      sub: openItems + ' open item' + (openItems !== 1 ? 's' : ''),
      onClick: () => switchSection('lists')
    }));

    // Fitness
    const fitDayAbbr = DAYS[new Date().getDay()];
    const fitPlan = state.fitnessSplit && state.fitnessSplit.days ? state.fitnessSplit.days[fitDayAbbr] : null;
    grid.appendChild(makeDashTile({
      color: '#F2617A',
      title: 'Fitness',
      stat: fitPlan ? fitPlan.focus : '—',
      sub: fitPlan && fitPlan.focus !== 'Rest' ? 'today' : 'rest day',
      onClick: () => switchSection('fitness')
    }));

    // Budget
    const bmKey = budgetMonthKey(new Date());
    const monthExpense = state.budgetTransactions.filter(t => t.date.startsWith(bmKey) && budgetCatById[t.category]?.type === 'expense').reduce((s,t) => s + t.amount, 0);
    grid.appendChild(makeDashTile({
      color: '#3FC7D6',
      title: 'Budget',
      stat: '$' + monthExpense.toFixed(0),
      sub: 'spent this month',
      onClick: () => switchSection('budget')
    }));

    wrap.appendChild(grid);
  }

  function makeDashTile(opts){
    const tile = document.createElement('div');
    tile.className = 'dash-tile';
    tile.style.setProperty('--accent-color', opts.color);
    tile.innerHTML = `
      <div class="dash-tile-title">${escapeHtml(opts.title)}</div>
      <div class="dash-tile-stat">${opts.stat}</div>
      <div class="dash-tile-sub">${opts.sub}</div>
    `;
    tile.onclick = opts.onClick;
    return tile;
  }

  /* ---------------- Fitness ---------------- */

  let fitnessSelectedDay = DAYS[new Date().getDay()];
  const EXERCISE_TYPES = [
    { id:'strength',    label:'Strength' },
    { id:'hypertrophy', label:'Hypertrophy' },
    { id:'accessory',   label:'Accessory' },
  ];

  function currentSplitWeekNumber(){
    if(!state.fitnessSplit) return null;
    const start = dateFromStr(state.fitnessSplit.startDate);
    const now = new Date(); now.setHours(0,0,0,0);
    const daysIn = Math.floor((now - start) / 86400000);
    if(daysIn < 0) return 0; // hasn't started yet
    return Math.min(8, Math.floor(daysIn / 7) + 1);
  }

  // Most recent logged sets for a given exercise, most-recent-first.
  function getExerciseHistory(exerciseId, beforeDateStr){
    const dates = Object.keys(state.workoutLogs)
      .filter(d => !beforeDateStr || d < beforeDateStr)
      .sort((a,b) => b.localeCompare(a));
    const history = [];
    dates.forEach(d => {
      const log = state.workoutLogs[d];
      if(log && log.exercises && log.exercises[exerciseId] && log.exercises[exerciseId].length){
        history.push({ date: d, sets: log.exercises[exerciseId] });
      }
    });
    return history;
  }

  // Applies the exact rules from the coaching prompt:
  // progress when the rep target is fully swept; hold when the last set
  // drops significantly; drop weight after a layoff or repeated failure.
  function getProgressionSuggestion(exercise, sets, exerciseId){
    const logged = sets.filter(s => s.reps !== null && s.reps !== undefined && s.reps !== '');
    if(!logged.length) return null;

    const repMin = exercise.repMin, repMax = exercise.repMax;
    const allHitTop = logged.length >= exercise.sets && logged.every(s => Number(s.reps) >= repMax);
    const lastSet = logged[logged.length - 1];
    const significantDrop = Number(lastSet.reps) < (repMin - 1);

    // Layoff check: more than 10 days since this exercise was last logged.
    const history = getExerciseHistory(exerciseId, todayStr());
    if(history.length){
      const lastDate = dateFromStr(history[0].date);
      const daysSince = Math.floor((new Date() - lastDate) / 86400000);
      if(daysSince > 10){
        return { verdict:'drop', text:'Layoff of ' + daysSince + '+ days — drop weight to ease back in.' };
      }
      // Two failed sessions in a row (both missed repMin somewhere)
      const lastFailed = history[0].sets.some(s => Number(s.reps) < repMin);
      const thisFailed = logged.some(s => Number(s.reps) < repMin);
      if(lastFailed && thisFailed){
        return { verdict:'drop', text:'Missed rep target two sessions running — drop weight ~10%.' };
      }
    }

    if(allHitTop) return { verdict:'progress', text:'Full rep target swept — add weight next session.' };
    if(significantDrop) return { verdict:'hold', text:'Last set dropped off — hold this weight next session.' };
    return { verdict:'maintain', text:'Repeat this weight next session.' };
  }

  function renderFitnessSection(){
    const wrap = document.getElementById('fitnessContent');
    wrap.innerHTML = '';

    if(!state.fitnessSplit){
      wrap.innerHTML = '<div class="empty-note">No split set up yet.</div>';
      return;
    }

    const weekNum = currentSplitWeekNumber();
    const weekLabelText = weekNum === 0 ? 'Starts ' + fmtDate(state.fitnessSplit.startDate)
      : weekNum > 8 ? 'Split complete'
      : 'Fall Split — Week ' + weekNum + ' of 8';
    const wl = document.createElement('div');
    wl.className = 'fit-week-label';
    wl.textContent = weekLabelText;
    wrap.appendChild(wl);

    // Day selector
    const tabs = document.createElement('div');
    tabs.className = 'fit-day-tabs';
    DAYS.forEach(d => {
      const day = state.fitnessSplit.days[d];
      const btn = document.createElement('button');
      btn.className = 'fit-day-tab' + (d === fitnessSelectedDay ? ' active' : '');
      btn.innerHTML = d + '<span class="fdt-focus">' + escapeHtml(day ? day.focus : '') + '</span>';
      btn.onclick = () => { fitnessSelectedDay = d; renderFitnessSection(); };
      tabs.appendChild(btn);
    });
    wrap.appendChild(tabs);

    const dayPlan = state.fitnessSplit.days[fitnessSelectedDay];
    const dateStr = (() => {
      // Map the selected weekday onto the real current week's date, so
      // logging always applies to an actual calendar date.
      const now = new Date();
      const sunday = new Date(now); sunday.setDate(now.getDate() - now.getDay());
      const idx = DAYS.indexOf(fitnessSelectedDay);
      const d = new Date(sunday); d.setDate(sunday.getDate() + idx);
      return toDateStr(d);
    })();

    if(!dayPlan || dayPlan.focus === 'Rest'){
      const rest = document.createElement('div');
      rest.className = 'fit-rest-note';
      rest.textContent = 'Rest day.';
      wrap.appendChild(rest);
      return;
    }

    if(!state.workoutLogs[dateStr]) state.workoutLogs[dateStr] = { exercises:{}, coachNotes:'' };
    const log = state.workoutLogs[dateStr];

    // Accessory-skip flag — non-negotiable per the coaching rules.
    const hasAccessoryPlanned = dayPlan.exercises.some(ex => ex.type === 'accessory');
    const hasAccessoryLogged = dayPlan.exercises.some(ex => ex.type === 'accessory' && log.exercises[ex.id] && log.exercises[ex.id].some(s => s.reps));
    if(hasAccessoryPlanned && !hasAccessoryLogged){
      const warn = document.createElement('div');
      warn.className = 'fit-accessory-warn';
      warn.textContent = '⚠ Accessory work not logged yet — non-negotiable, don\'t skip it.';
      wrap.appendChild(warn);
    }

    if(!dayPlan.exercises.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'No exercises added for ' + fullDayName(fitnessSelectedDay) + ' yet — tap + to add one.';
      wrap.appendChild(empty);
    }

    dayPlan.exercises.forEach(ex => {
      if(!log.exercises[ex.id]) log.exercises[ex.id] = Array.from({length: ex.sets}, () => ({ weight:'', reps:'' }));
      // If the plan's set count grew since last logged, pad it out.
      while(log.exercises[ex.id].length < ex.sets) log.exercises[ex.id].push({ weight:'', reps:'' });

      const card = document.createElement('div');
      card.className = 'fit-ex-card';
      const typeLabel = EXERCISE_TYPES.find(t => t.id === ex.type)?.label || ex.type;
      card.innerHTML = `
        <div class="fit-ex-top">
          <div>
            <div class="fit-ex-name">${escapeHtml(ex.name)}</div>
            <div class="fit-ex-target">${ex.sets}×${ex.repMin}–${ex.repMax}</div>
          </div>
          <span class="fit-ex-type">${escapeHtml(typeLabel)}</span>
          <button class="fit-ex-del">×</button>
        </div>
      `;
      card.querySelector('.fit-ex-del').onclick = () => {
        state.fitnessSplit.days[fitnessSelectedDay].exercises = dayPlan.exercises.filter(x => x.id !== ex.id);
        save();
        renderFitnessSection();
      };

      const history = getExerciseHistory(ex.id, dateStr);
      if(history.length){
        const h = document.createElement('div');
        h.className = 'fit-history';
        h.textContent = 'Last: ' + history[0].sets.map(s => (s.weight||'—') + '×' + (s.reps||'—')).join(', ') + ' (' + fmtDate(history[0].date) + ')';
        card.appendChild(h);
      }

      log.exercises[ex.id].forEach((setEntry, i) => {
        const row = document.createElement('div');
        row.className = 'fit-set-row';
        row.innerHTML = `
          <span class="fit-set-label">Set ${i+1}</span>
          <input type="number" placeholder="lbs" step="2.5" class="fit-weight">
          <span class="fit-x">×</span>
          <input type="number" placeholder="reps" class="fit-reps">
        `;
        row.querySelector('.fit-weight').value = setEntry.weight;
        row.querySelector('.fit-reps').value = setEntry.reps;
        row.querySelector('.fit-weight').addEventListener('change', (e) => {
          setEntry.weight = e.target.value;
          save();
        });
        row.querySelector('.fit-reps').addEventListener('change', (e) => {
          setEntry.reps = e.target.value;
          save();
          renderFitnessSection();
        });
        card.appendChild(row);
      });

      const suggestion = getProgressionSuggestion(ex, log.exercises[ex.id], ex.id);
      if(suggestion){
        const tag = document.createElement('div');
        tag.className = 'fit-progression ' + suggestion.verdict;
        tag.textContent = suggestion.text;
        card.appendChild(tag);
      }

      wrap.appendChild(card);
    });

    const notesBox = document.createElement('div');
    notesBox.className = 'fit-coach-notes';
    notesBox.innerHTML = '<label>Coach notes (paste your rating/feedback here)</label><textarea placeholder="e.g. 8/10 — bench felt strong, rows were shaky on set 3…"></textarea>';
    notesBox.querySelector('textarea').value = log.coachNotes || '';
    notesBox.querySelector('textarea').addEventListener('blur', (e) => {
      log.coachNotes = e.target.value.trim();
      save();
    });
    wrap.appendChild(notesBox);
  }

  function openAddExerciseModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    let exType = 'hypertrophy';

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Add exercise — ${escapeHtml(fullDayName(fitnessSelectedDay))}</div>
      <label>Name</label>
      <input type="text" id="exName" placeholder="e.g. Lateral Raise" maxlength="50">
      <label>Type</label>
      <div class="cat-picker" id="exTypePicker"></div>
      <label>Sets</label>
      <input type="number" id="exSets" min="1" step="1" value="3">
      <label>Rep range</label>
      <div class="add-row1">
        <input type="number" id="exRepMin" min="1" step="1" value="8" style="width:70px">
        <span style="align-self:center; color:var(--text-faint)">to</span>
        <input type="number" id="exRepMax" min="1" step="1" value="12" style="width:70px">
      </div>
      <div class="modal-actions">
        <button class="cancel" id="exCancel">Cancel</button>
        <button class="save" id="exSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    const renderTypePicker = () => {
      const box = document.getElementById('exTypePicker');
      box.innerHTML = '';
      EXERCISE_TYPES.forEach(t => {
        const opt = document.createElement('button');
        opt.className = 'cat-option' + (exType === t.id ? ' selected' : '');
        opt.textContent = t.label;
        opt.onclick = () => { exType = t.id; renderTypePicker(); };
        box.appendChild(opt);
      });
    };
    renderTypePicker();

    document.getElementById('exCancel').onclick = closeModal;
    document.getElementById('exSave').onclick = () => {
      const name = document.getElementById('exName').value.trim();
      if(!name) return;
      const sets = Math.max(1, parseInt(document.getElementById('exSets').value, 10) || 3);
      const repMin = Math.max(1, parseInt(document.getElementById('exRepMin').value, 10) || 8);
      const repMax = Math.max(repMin, parseInt(document.getElementById('exRepMax').value, 10) || 12);
      state.fitnessSplit.days[fitnessSelectedDay].exercises.push({
        id: 'ex-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
        name, type: exType, sets, repMin, repMax
      });
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('exName').focus(), 50);
  }

  /* ---------------- Budget ---------------- */

  function budgetMonthKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1); }
  let budgetSelectedMonth = budgetMonthKey(new Date());
  let budgetViewMode = 'month'; // 'month' | 'quarter' | 'ytd'
  let budgetSelectedQuarter = { year: new Date().getFullYear(), q: Math.floor(new Date().getMonth()/3) + 1 };
  let budgetSelectedYear = new Date().getFullYear();

  function budgetMonthLabel(monthKeyStr){
    const [y,m] = monthKeyStr.split('-').map(Number);
    return new Date(y, m-1, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' });
  }

  function shiftBudgetMonth(delta){
    const [y,m] = budgetSelectedMonth.split('-').map(Number);
    const d = new Date(y, m-1+delta, 1);
    budgetSelectedMonth = budgetMonthKey(d);
    renderBudgetSection();
  }

  function shiftBudgetQuarter(delta){
    let { year, q } = budgetSelectedQuarter;
    q += delta;
    if(q < 1){ q = 4; year--; } else if(q > 4){ q = 1; year++; }
    budgetSelectedQuarter = { year, q };
    renderBudgetSection();
  }

  function shiftBudgetYear(delta){
    budgetSelectedYear += delta;
    renderBudgetSection();
  }

  function txnsForQuarter(year, q){
    const startMonth = (q - 1) * 3 + 1;
    const monthKeys = [startMonth, startMonth+1, startMonth+2].map(m => year + '-' + pad2(m));
    return state.budgetTransactions.filter(t => monthKeys.includes(t.date.slice(0,7)));
  }

  function txnsForYearToDate(year){
    const realCurrentYear = new Date().getFullYear();
    if(year === realCurrentYear){
      const todayS = todayStr();
      return state.budgetTransactions.filter(t => t.date.slice(0,4) === String(year) && t.date <= todayS);
    }
    return state.budgetTransactions.filter(t => t.date.slice(0,4) === String(year));
  }

  // Shared stats + category breakdown renderer, used by all three views.
  function renderBudgetStatsAndCategories(wrap, txns, showBudgets){
    const totalIncome = txns.filter(t => budgetCatById[t.category]?.type === 'income').reduce((s,t) => s + t.amount, 0);
    const totalExpense = txns.filter(t => budgetCatById[t.category]?.type === 'expense').reduce((s,t) => s + t.amount, 0);
    const net = totalIncome - totalExpense;

    const stats = document.createElement('div');
    stats.className = 'budget-stats-row';
    stats.innerHTML = `
      <div class="budget-stat"><div class="budget-stat-num" style="color:#3CBF8C">$${totalIncome.toFixed(2)}</div><div class="budget-stat-label">Income</div></div>
      <div class="budget-stat"><div class="budget-stat-num" style="color:#F2617A">$${totalExpense.toFixed(2)}</div><div class="budget-stat-label">Expenses</div></div>
      <div class="budget-stat"><div class="budget-stat-num" style="color:${net >= 0 ? '#3CBF8C' : '#F2617A'}">$${net.toFixed(2)}</div><div class="budget-stat-label">Net</div></div>
    `;
    wrap.appendChild(stats);

    ['expense','neutral','income'].forEach(type => {
      const catsOfType = BUDGET_CATEGORIES.filter(c => c.type === type);
      const rows = catsOfType.map(c => {
        const total = txns.filter(t => t.category === c.id).reduce((s,t) => s + t.amount, 0);
        return { cat:c, total };
      }).filter(r => r.total > 0).sort((a,b) => b.total - a.total);
      if(!rows.length) return;

      const title = document.createElement('div');
      title.className = 'task-section-title';
      title.style.cursor = 'default';
      title.style.marginTop = '16px';
      title.innerHTML = '<span>' + (type === 'expense' ? 'Spending' : type === 'neutral' ? 'Savings & Transfers' : 'Income') + ' by category</span>';
      wrap.appendChild(title);

      rows.forEach(r => {
        const row = document.createElement('div');
        row.className = 'budget-cat-row';
        row.style.setProperty('--accent-color', BUDGET_TYPE_COLORS[type]);
        const limit = (showBudgets && type === 'expense') ? state.categoryBudgetLimits[r.cat.id] : null;
        let amtHtml = '$' + r.total.toFixed(2);
        let amtStyle = '';
        if(limit){
          amtHtml += ' <span style="opacity:0.6">/ $' + limit.toFixed(2) + '</span>';
          if(r.total > limit) amtStyle = 'color:#F2617A';
        }
        row.innerHTML = '<span class="budget-cat-name">' + escapeHtml(r.cat.label) + '</span><span class="budget-cat-amt" style="' + amtStyle + '">' + amtHtml + '</span>';
        wrap.appendChild(row);
      });
    });

    return { totalIncome, totalExpense, net };
  }

  function computeCategoryBudgetStatus(monthTxns){
    const results = [];
    BUDGET_CATEGORIES.filter(c => c.type === 'expense').forEach(c => {
      const limit = state.categoryBudgetLimits[c.id];
      if(!limit) return;
      const spent = monthTxns.filter(t => t.category === c.id).reduce((s,t) => s + t.amount, 0);
      results.push({ cat:c, limit, spent, over: spent > limit });
    });
    return results;
  }

  function renderCategoryBudgetsBar(wrap, monthTxns){
    const box = document.createElement('div');
    box.className = 'budget-limit-box';
    const statuses = computeCategoryBudgetStatus(monthTxns);
    const overOnes = statuses.filter(s => s.over);

    if(overOnes.length){
      box.innerHTML = '<div class="budget-limit-top" style="color:#F2617A">'
        + overOnes.length + ' categor' + (overOnes.length > 1 ? 'ies' : 'y') + ' over budget</div>'
        + overOnes.map(s => '<div style="font-size:11.5px;color:#F2617A;margin-top:4px">'
            + escapeHtml(s.cat.label) + ' — $' + s.spent.toFixed(2) + ' of $' + s.limit.toFixed(2) + '</div>').join('')
        + '<button class="budget-limit-edit" id="budgetLimitEdit" style="margin-top:9px">Edit category budgets</button>';
    } else if(statuses.length){
      box.innerHTML = '<div class="budget-limit-top"><span>' + statuses.length + ' categor' + (statuses.length > 1 ? 'ies' : 'y')
        + ' budgeted — all on track</span><button class="budget-limit-edit" id="budgetLimitEdit">Edit</button></div>';
    } else {
      box.innerHTML = '<button class="budget-limit-edit" id="budgetLimitEdit">+ Set category budgets to track against</button>';
    }
    wrap.appendChild(box);
    box.querySelector('#budgetLimitEdit').onclick = openCategoryBudgetsModal;
  }

  function openCategoryBudgetsModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    const expenseCats = BUDGET_CATEGORIES.filter(c => c.type === 'expense');
    const rowsHtml = expenseCats.map(c => `
      <div class="dur-row">
        <span class="dur-key" style="text-transform:none">${escapeHtml(c.label)}</span>
        <input type="number" class="cb-input" data-cat="${c.id}" min="0" step="10" value="${state.categoryBudgetLimits[c.id] || ''}" placeholder="none" style="width:80px">
      </div>
    `).join('');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Category budgets</div>
      <div class="modal-subtitle">Monthly limit per expense category — leave blank for none</div>
      <div class="dur-list">${rowsHtml}</div>
      <div class="modal-actions">
        <button class="cancel" id="cbClose" style="flex:1">Done</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    content.querySelectorAll('.cb-input').forEach(inp => {
      inp.onchange = () => {
        const catId = inp.dataset.cat;
        const val = parseFloat(inp.value);
        if(val && val > 0) state.categoryBudgetLimits[catId] = val;
        else delete state.categoryBudgetLimits[catId];
        save();
      };
    });
    document.getElementById('cbClose').onclick = () => { closeModal(); renderAll(); };
  }

  function renderBudgetSection(){
    const wrap = document.getElementById('budgetContent');
    wrap.innerHTML = '';

    // Links back to the existing sheet/form, for the Jan–Jun history and
    // as a fallback entry point.
    const links = document.createElement('div');
    links.className = 'budget-links';
    links.innerHTML = `
      <a class="budget-link-btn" href="${BUDGET_SHEET_URL}" target="_blank" rel="noopener">📊 Open Sheet</a>
      <a class="budget-link-btn" href="${BUDGET_FORM_URL}" target="_blank" rel="noopener">📝 Open Form</a>
    `;
    wrap.appendChild(links);

    // Month / Quarter / YTD toggle
    const modeToggle = document.createElement('div');
    modeToggle.className = 'view-toggle';
    modeToggle.style.margin = '0 0 14px';
    modeToggle.innerHTML = `
      <button id="budgetModeMonth" class="${budgetViewMode === 'month' ? 'active' : ''}">Month</button>
      <button id="budgetModeQuarter" class="${budgetViewMode === 'quarter' ? 'active' : ''}">Quarter</button>
      <button id="budgetModeYtd" class="${budgetViewMode === 'ytd' ? 'active' : ''}">Year to date</button>
    `;
    wrap.appendChild(modeToggle);
    modeToggle.querySelector('#budgetModeMonth').onclick = () => { budgetViewMode = 'month'; renderBudgetSection(); };
    modeToggle.querySelector('#budgetModeQuarter').onclick = () => { budgetViewMode = 'quarter'; renderBudgetSection(); };
    modeToggle.querySelector('#budgetModeYtd').onclick = () => { budgetViewMode = 'ytd'; renderBudgetSection(); };

    if(budgetViewMode === 'month'){
      const monthNav = document.createElement('div');
      monthNav.className = 'budget-month-nav';
      monthNav.innerHTML = `
        <button class="week-nav-btn" id="budgetPrevMonth">‹</button>
        <span class="budget-month-label">${budgetMonthLabel(budgetSelectedMonth)}</span>
        <button class="week-nav-btn" id="budgetNextMonth">›</button>
      `;
      wrap.appendChild(monthNav);
      monthNav.querySelector('#budgetPrevMonth').onclick = () => shiftBudgetMonth(-1);
      monthNav.querySelector('#budgetNextMonth').onclick = () => shiftBudgetMonth(1);

      const monthTxns = state.budgetTransactions.filter(t => t.date.startsWith(budgetSelectedMonth));
      renderBudgetStatsAndCategories(wrap, monthTxns, true);
      renderCategoryBudgetsBar(wrap, monthTxns);

      const txnTitle = document.createElement('div');
      txnTitle.className = 'task-section-title';
      txnTitle.style.cursor = 'default';
      txnTitle.style.marginTop = '18px';
      txnTitle.innerHTML = '<span>Transactions</span>';
      wrap.appendChild(txnTitle);

      if(!monthTxns.length){
        const empty = document.createElement('div');
        empty.className = 'empty-note';
        empty.textContent = 'Nothing logged for ' + budgetMonthLabel(budgetSelectedMonth) + ' yet — tap + to add one.';
        wrap.appendChild(empty);
      } else {
        monthTxns.slice().sort((a,b) => b.date.localeCompare(a.date)).forEach(t => {
          const cat = budgetCatById[t.category];
          const row = document.createElement('div');
          row.className = 'budget-txn-row';
          row.style.setProperty('--accent-color', BUDGET_TYPE_COLORS[cat?.type || 'expense']);
          row.innerHTML = `
            <div style="flex:1">
              <div class="budget-txn-desc">${escapeHtml(t.description || cat?.label || 'Transaction')}</div>
              <div class="budget-txn-meta">${fmtDate(t.date)} · ${escapeHtml(cat?.label || t.category)}</div>
            </div>
            <div class="budget-txn-amt ${cat?.type || 'expense'}">${cat?.type === 'income' ? '+' : cat?.type === 'expense' ? '−' : ''}$${t.amount.toFixed(2)}</div>
            <button class="budget-txn-del">×</button>
          `;
          row.querySelector('.budget-txn-del').onclick = () => {
            state.budgetTransactions = state.budgetTransactions.filter(x => x.id !== t.id);
            save();
            renderBudgetSection();
          };
          wrap.appendChild(row);
        });
      }
    }

    else if(budgetViewMode === 'quarter'){
      const { year, q } = budgetSelectedQuarter;
      const qNav = document.createElement('div');
      qNav.className = 'budget-month-nav';
      qNav.innerHTML = `
        <button class="week-nav-btn" id="budgetPrevQ">‹</button>
        <span class="budget-month-label">Q${q} ${year}</span>
        <button class="week-nav-btn" id="budgetNextQ">›</button>
      `;
      wrap.appendChild(qNav);
      qNav.querySelector('#budgetPrevQ').onclick = () => shiftBudgetQuarter(-1);
      qNav.querySelector('#budgetNextQ').onclick = () => shiftBudgetQuarter(1);

      const qTxns = txnsForQuarter(year, q);
      renderBudgetStatsAndCategories(wrap, qTxns);
      if(!qTxns.length){
        const empty = document.createElement('div');
        empty.className = 'empty-note';
        empty.style.marginTop = '14px';
        empty.textContent = 'Nothing logged for Q' + q + ' ' + year + '.';
        wrap.appendChild(empty);
      }
    }

    else if(budgetViewMode === 'ytd'){
      const yNav = document.createElement('div');
      yNav.className = 'budget-month-nav';
      yNav.innerHTML = `
        <button class="week-nav-btn" id="budgetPrevY">‹</button>
        <span class="budget-month-label">${budgetSelectedYear} Year to Date</span>
        <button class="week-nav-btn" id="budgetNextY">›</button>
      `;
      wrap.appendChild(yNav);
      yNav.querySelector('#budgetPrevY').onclick = () => shiftBudgetYear(-1);
      yNav.querySelector('#budgetNextY').onclick = () => shiftBudgetYear(1);

      const yTxns = txnsForYearToDate(budgetSelectedYear);
      renderBudgetStatsAndCategories(wrap, yTxns);
      if(!yTxns.length){
        const empty = document.createElement('div');
        empty.className = 'empty-note';
        empty.style.marginTop = '14px';
        empty.textContent = 'Nothing logged for ' + budgetSelectedYear + ' yet.';
        wrap.appendChild(empty);
      }
    }
  }

  function openAddTransactionModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    let selectedBudgetCat = 'misc';

    const catOptionsHtml = ['expense','neutral','income'].map(type => {
      const opts = BUDGET_CATEGORIES.filter(c => c.type === type)
        .map(c => '<option value="' + c.id + '">' + escapeHtml(c.label) + '</option>').join('');
      const groupLabel = type === 'expense' ? 'Expense' : type === 'neutral' ? 'Savings / Transfer' : 'Income';
      return '<optgroup label="' + groupLabel + '">' + opts + '</optgroup>';
    }).join('');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Add transaction</div>
      <label>Date</label>
      <input type="date" id="txnDate" value="${todayStr()}">
      <label>Description</label>
      <input type="text" id="txnDesc" placeholder="e.g. Publix" maxlength="60">
      <label>Amount</label>
      <input type="number" id="txnAmount" min="0" step="0.01" placeholder="0.00">
      <label>Category</label>
      <select id="txnCategory">${catOptionsHtml}</select>
      <div class="modal-actions">
        <button class="cancel" id="txnCancel">Cancel</button>
        <button class="save" id="txnSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    document.getElementById('txnCancel').onclick = closeModal;
    document.getElementById('txnSave').onclick = () => {
      const date = document.getElementById('txnDate').value || todayStr();
      const description = document.getElementById('txnDesc').value.trim();
      const amount = Math.max(0, parseFloat(document.getElementById('txnAmount').value) || 0);
      const category = document.getElementById('txnCategory').value;
      if(!amount) return;
      state.budgetTransactions.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        date, description, amount, category
      });
      save();
      // Jump the month view to wherever this transaction landed
      budgetSelectedMonth = date.slice(0,7);
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('txnAmount').focus(), 50);
  }

  /* ---------------- Projects ---------------- */

  const PROJECT_STATUSES = [
    { id:'active',    label:'Active' },
    { id:'on-hold',   label:'On Hold' },
    { id:'completed', label:'Completed' },
    { id:'archived',  label:'Archived' },
  ];

  let collapsedProjects = new Set();

  function getProjectTasks(projectId){
    return state.tasks.filter(t => t.projectId === projectId);
  }

  function getProjectProgress(project){
    const tasks = getProjectTasks(project.id);
    const milestones = project.milestones || [];
    const total = tasks.length + milestones.length;
    if(!total) return null;
    const done = tasks.filter(t => t.done).length + milestones.filter(m => m.done).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }

  function renderProjectsSection(){
    const wrap = document.getElementById('projectsContent');
    wrap.innerHTML = '';

    if(!state.projects.length){
      wrap.innerHTML = '<div class="empty-note">No projects yet — tap + to start one.</div>';
      return;
    }

    const sorted = state.projects.slice().sort((a,b) => {
      if(!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      const statusOrder = { active:0, 'on-hold':1, completed:2, archived:3 };
      return (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1);
    });

    sorted.forEach(project => {
      const cat = catById[project.category] || CATEGORIES[0];
      const collapsed = collapsedProjects.has(project.id);
      const progress = getProjectProgress(project);

      const card = document.createElement('div');
      card.className = 'proj-card';
      card.style.setProperty('--accent-color', cat.color);

      const top = document.createElement('div');
      top.className = 'proj-card-top';
      top.innerHTML = `
        <div class="proj-header-click" style="flex:1; cursor:pointer;">
          <div class="proj-name-row">
            <button class="proj-pin-btn${project.pinned ? ' pinned' : ''}">${project.pinned ? '★' : '☆'}</button>
            <span class="proj-name">${escapeHtml(project.name)}</span>
            <span class="proj-status ${project.status}">${PROJECT_STATUSES.find(s=>s.id===project.status)?.label || project.status}</span>
          </div>
          ${project.description ? '<div class="proj-desc">' + escapeHtml(project.description) + '</div>' : ''}
        </div>
        <button class="proj-del">×</button>
      `;
      top.querySelector('.proj-pin-btn').onclick = (e) => {
        e.stopPropagation();
        project.pinned = !project.pinned;
        save();
        renderProjectsSection();
      };
      top.querySelector('.proj-del').onclick = (e) => {
        e.stopPropagation();
        state.projects = state.projects.filter(p => p.id !== project.id);
        save();
        renderAll();
      };
      top.querySelector('.proj-header-click').addEventListener('click', () => {
        if(collapsedProjects.has(project.id)) collapsedProjects.delete(project.id);
        else collapsedProjects.add(project.id);
        renderProjectsSection();
      });
      card.appendChild(top);

      if(progress){
        const pbox = document.createElement('div');
        pbox.className = 'proj-progress';
        pbox.innerHTML = `
          <div class="proj-progress-label">${progress.done}/${progress.total} complete</div>
          <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${progress.pct}%; background:${cat.color}"></div></div>
        `;
        card.appendChild(pbox);
      }

      if(!collapsed){
        // Tasks
        const taskLabel = document.createElement('div');
        taskLabel.className = 'proj-section-label';
        taskLabel.textContent = 'Tasks';
        card.appendChild(taskLabel);

        const tasks = getProjectTasks(project.id);
        tasks.forEach(t => {
          const row = document.createElement('div');
          row.className = 'proj-task-row' + (t.done ? ' done' : '');
          row.innerHTML = '<button class="proj-task-check">✓</button><span class="proj-task-text"></span><button class="proj-mini-del">×</button>';
          row.querySelector('.proj-task-text').textContent = t.text;
          row.querySelector('.proj-task-check').onclick = () => { t.done = !t.done; save(); renderAll(); };
          row.querySelector('.proj-mini-del').onclick = () => {
            state.tasks = state.tasks.filter(x => x.id !== t.id);
            save();
            renderAll();
          };
          card.appendChild(row);
        });

        const taskAddRow = document.createElement('div');
        taskAddRow.className = 'proj-add-row';
        taskAddRow.innerHTML = '<input type="text" placeholder="Add a task…" maxlength="70"><button>Add</button>';
        const taskInput = taskAddRow.querySelector('input');
        const addTask = () => {
          const text = taskInput.value.trim();
          if(!text) return;
          state.tasks.push({
            id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
            text, category: project.category, subcategory:'', dueDate: todayStr(),
            priority:'normal', points:null, notes:'', projectId: project.id, done:false
          });
          save();
          renderAll();
        };
        taskAddRow.querySelector('button').onclick = addTask;
        taskInput.addEventListener('keydown', e => { if(e.key === 'Enter') addTask(); });
        card.appendChild(taskAddRow);

        // Milestones
        const msLabel = document.createElement('div');
        msLabel.className = 'proj-section-label';
        msLabel.textContent = 'Milestones';
        card.appendChild(msLabel);

        (project.milestones || []).forEach(m => {
          const row = document.createElement('div');
          row.className = 'proj-milestone-row' + (m.done ? ' done' : '');
          row.innerHTML = '<button class="proj-milestone-check">✓</button><span class="proj-milestone-text"></span>'
            + (m.targetDate ? '<span class="proj-milestone-date">' + fmtDate(m.targetDate) + '</span>' : '')
            + '<button class="proj-mini-del">×</button>';
          row.querySelector('.proj-milestone-text').textContent = m.name;
          row.querySelector('.proj-milestone-check').onclick = () => { m.done = !m.done; save(); renderAll(); };
          row.querySelector('.proj-mini-del').onclick = () => {
            project.milestones = project.milestones.filter(x => x.id !== m.id);
            save();
            renderAll();
          };
          card.appendChild(row);
        });

        const msAddRow = document.createElement('div');
        msAddRow.className = 'proj-add-row';
        msAddRow.innerHTML = '<input type="text" placeholder="Add a milestone…" maxlength="60"><input type="date"><button>Add</button>';
        const msTextInput = msAddRow.querySelector('input[type=text]');
        const msDateInput = msAddRow.querySelector('input[type=date]');
        const addMilestone = () => {
          const name = msTextInput.value.trim();
          if(!name) return;
          if(!project.milestones) project.milestones = [];
          project.milestones.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,7), name, targetDate: msDateInput.value || null, done:false });
          save();
          renderAll();
        };
        msAddRow.querySelector('button').onclick = addMilestone;
        msTextInput.addEventListener('keydown', e => { if(e.key === 'Enter') addMilestone(); });
        card.appendChild(msAddRow);

        // Goal link
        const goalBox = document.createElement('div');
        goalBox.className = 'proj-goal-link';
        goalBox.innerHTML = '<div class="proj-section-label">Linked goal</div><select><option value="">None</option>'
          + state.longTermGoals.map(g => '<option value="' + g.id + '"' + (project.goalId === g.id ? ' selected' : '') + '>' + escapeHtml(g.name) + ' (' + g.timeframe + ')</option>').join('')
          + '</select>';
        goalBox.querySelector('select').onchange = (e) => {
          project.goalId = e.target.value || null;
          save();
        };
        card.appendChild(goalBox);

        // Notes
        const notesBox = document.createElement('div');
        notesBox.className = 'proj-notes';
        notesBox.innerHTML = '<div class="proj-section-label">Notes</div><textarea placeholder="Updates, decisions, context…"></textarea>';
        notesBox.querySelector('textarea').value = project.notes || '';
        notesBox.querySelector('textarea').addEventListener('blur', (e) => {
          project.notes = e.target.value.trim();
          save();
        });
        card.appendChild(notesBox);

        // Status changer
        const statusRow = document.createElement('div');
        statusRow.className = 'cat-picker';
        statusRow.style.marginTop = '12px';
        PROJECT_STATUSES.forEach(s => {
          const btn = document.createElement('button');
          btn.className = 'cat-option' + (project.status === s.id ? ' selected' : '');
          btn.textContent = s.label;
          btn.onclick = () => { project.status = s.id; save(); renderProjectsSection(); };
          statusRow.appendChild(btn);
        });
        card.appendChild(statusRow);
      }

      wrap.appendChild(card);
    });
  }

  function openAddProjectModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    let selectedCat = 'personal';

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">New project</div>
      <label>Name</label>
      <input type="text" id="projName" placeholder="e.g. The Standard" maxlength="60">
      <label>Category</label>
      <div class="cat-picker" id="projCatPicker"></div>
      <label>Description (optional)</label>
      <textarea id="projDesc" placeholder="What is this project?" rows="2"></textarea>
      <label>Due date (optional)</label>
      <input type="date" id="projDue">
      <div class="modal-actions">
        <button class="cancel" id="projCancel">Cancel</button>
        <button class="save" id="projSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');
    renderCategoryPickerInline('projCatPicker', selectedCat, (c) => { selectedCat = c; });

    document.getElementById('projCancel').onclick = closeModal;
    document.getElementById('projSave').onclick = () => {
      const name = document.getElementById('projName').value.trim();
      if(!name) return;
      state.projects.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        name, category: selectedCat,
        description: document.getElementById('projDesc').value.trim(),
        dueDate: document.getElementById('projDue').value || null,
        status: 'active', pinned: false, milestones: [], notes: '', goalId: null
      });
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('projName').focus(), 50);
  }

  /* ---------------- Journal ---------------- */

  const JOURNAL_PROMPTS = [
    "What's one thing that went well today?",
    "What's weighing on your mind right now?",
    "Describe a moment today you'd like to remember.",
    "What are you grateful for today?",
    "What's something you're avoiding, and why?",
    "What did you learn today?",
    "How did you take care of yourself today?",
    "What's a small win you can celebrate?",
    "What's one thing you'd do differently today?",
    "Who made your day better, and how?",
    "What's on your mind about the week ahead?",
    "What's a challenge you faced today, and how did you handle it?",
    "What made you laugh or smile today?",
    "What's something you're looking forward to?",
    "How are you really feeling right now?",
    "What's a decision you're wrestling with?",
    "What's something you did today that aligned with your values?",
    "What would make tomorrow better than today?",
    "What's a habit you want to build or break?",
    "What's something you're proud of this week?",
    "Describe your energy today — what shaped it?",
    "What's a conversation that stuck with you today?",
    "What's something you need to let go of?",
    "What did today teach you about yourself?",
    "What's one thing you can simplify in your life right now?",
    "What's a fear you're facing lately?",
    "What's something you did for someone else today?",
    "How did you spend your time today, and how do you feel about it?",
    "What's a goal you made progress on today, even a little?",
    "What's something beautiful you noticed today?",
    "What's a lesson from the past you're applying now?",
    "What's something you wish someone understood about you?",
    "What's a boundary you set or need to set?",
    "What's giving you peace lately?",
    "What's something you're curious about right now?",
    "How did today compare to what you expected?",
    "What's a risk you're considering taking?",
    "What does rest look like for you right now?",
    "What's something you want to remember about this season of life?",
    "What's one word that sums up today?",
  ];

  function getPromptForDate(dateStr){
    const d = dateFromStr(dateStr);
    const epochDays = Math.floor(d.getTime() / 86400000);
    const idx = ((epochDays % JOURNAL_PROMPTS.length) + JOURNAL_PROMPTS.length) % JOURNAL_PROMPTS.length;
    return JOURNAL_PROMPTS[idx];
  }

  let journalSelectedDate = todayStr();

  function shiftJournalDate(delta){
    const d = dateFromStr(journalSelectedDate);
    d.setDate(d.getDate() + delta);
    const newDateStr = toDateStr(d);
    if(newDateStr > todayStr()) return; // no writing future entries
    journalSelectedDate = newDateStr;
    renderJournalSection();
  }

  function renderJournalSection(){
    const wrap = document.getElementById('journalContent');
    wrap.innerHTML = '';
    const isToday = journalSelectedDate === todayStr();
    const entry = state.journalEntries[journalSelectedDate];

    const nav = document.createElement('div');
    nav.className = 'budget-month-nav';
    nav.innerHTML = `
      <button class="week-nav-btn" id="journalPrev">‹</button>
      <span class="budget-month-label">${isToday ? 'Today · ' : ''}${fmtDate(journalSelectedDate)}</span>
      <button class="week-nav-btn" id="journalNext"${isToday ? ' disabled style="opacity:0.3"' : ''}>›</button>
    `;
    wrap.appendChild(nav);
    nav.querySelector('#journalPrev').onclick = () => shiftJournalDate(-1);
    if(!isToday) nav.querySelector('#journalNext').onclick = () => shiftJournalDate(1);

    const journalHabit = state.dailyGoals.find(g => g.auto === 'Journal');
    if(journalHabit){
      const streak = computeDailyGoalStreak(journalHabit.id);
      if(streak){
        const streakLine = document.createElement('div');
        streakLine.className = 'fit-week-label';
        streakLine.textContent = streak + '-day streak 🔥';
        wrap.appendChild(streakLine);
      }
    }

    const card = document.createElement('div');
    card.className = 'lg-card';
    card.innerHTML = `
      <div class="proj-desc" style="font-style:italic; margin-bottom:10px;">${escapeHtml(getPromptForDate(journalSelectedDate))}</div>
      <textarea placeholder="Start writing…" rows="8"></textarea>
      <div class="lg-saved-tag">Saved</div>
    `;
    const textarea = card.querySelector('textarea');
    textarea.value = (entry && entry.text) || '';
    const savedTag = card.querySelector('.lg-saved-tag');
    textarea.addEventListener('blur', () => {
      const text = textarea.value.trim();
      if(text){
        state.journalEntries[journalSelectedDate] = { prompt: getPromptForDate(journalSelectedDate), text };
      } else {
        delete state.journalEntries[journalSelectedDate];
      }
      save();
      savedTag.classList.add('show');
      setTimeout(() => savedTag.classList.remove('show'), 1500);
      renderHabitsSection(); // Journal habit completion may have just changed
    });
    wrap.appendChild(card);

    // History
    const entryDates = Object.keys(state.journalEntries).sort((a,b) => b.localeCompare(a));
    if(entryDates.length){
      const histTitle = document.createElement('div');
      histTitle.className = 'task-section-title';
      histTitle.style.cursor = 'default';
      histTitle.style.marginTop = '18px';
      histTitle.innerHTML = '<span>History</span>';
      wrap.appendChild(histTitle);

      entryDates.slice(0, 30).forEach(ds => {
        const e = state.journalEntries[ds];
        const row = document.createElement('div');
        row.className = 'list-item';
        row.style.setProperty('--accent-color', '#B18CF2');
        row.style.cursor = 'pointer';
        const snippet = e.text.length > 60 ? e.text.slice(0,60) + '…' : e.text;
        row.innerHTML = '<div style="flex:1"><div class="txt"></div><div class="cat"></div></div>';
        row.querySelector('.txt').textContent = snippet;
        row.querySelector('.cat').textContent = fmtDate(ds) + (ds === journalSelectedDate ? ' · viewing' : '');
        row.querySelector('.cat').style.color = '#B18CF2';
        row.onclick = () => { journalSelectedDate = ds; renderJournalSection(); };
        wrap.appendChild(row);
      });
    }
  }

  function seedJournalHabit(){
    if(!state.seedFlags) state.seedFlags = {};
    if(state.seedFlags.journalHabitAdded) return;
    if(!state.dailyGoals.some(g => g.auto === 'Journal')){
      state.dailyGoals.push({ id: 'journal-habit', name: 'Journal', auto: 'Journal' });
    }
    state.seedFlags.journalHabitAdded = true;
    save();
  }

  // Small ▲/▼/– indicator comparing this week's number to last week's.
  function trendBadge(current, previous){
    if(previous === current) return '<span class="trend-flat">– same as last wk</span>';
    const up = current > previous;
    const diff = Math.abs(current - previous);
    return '<span class="' + (up ? 'trend-up' : 'trend-down') + '">' + (up ? '▲' : '▼') + diff + ' vs last wk</span>';
  }

  function getWeekTaskStats(weekStart, weekEnd){
    const weekTasks = state.tasks.filter(t => t.dueDate >= weekStart && t.dueDate <= weekEnd);
    return { total: weekTasks.length, done: weekTasks.filter(t => t.done).length };
  }

  function openWeeklyReviewModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');

    const dates = weekDates();
    const weekStart = toDateStr(dates[0]);
    const weekEnd = toDateStr(dates[6]);
    const today = todayStr();

    const prevWeekStartDate = new Date(dates[0]);
    prevWeekStartDate.setDate(prevWeekStartDate.getDate() - 7);
    const prevDates = datesForWeekStart(toDateStr(prevWeekStartDate));
    const prevWeekStart = toDateStr(prevDates[0]);
    const prevWeekEnd = toDateStr(prevDates[6]);

    const weekTasks = state.tasks.filter(t => t.dueDate >= weekStart && t.dueDate <= weekEnd);
    const doneCount = weekTasks.filter(t => t.done).length;
    const pendingCount = weekTasks.length - doneCount;
    const overdueCount = state.tasks.filter(t => !t.done && t.dueDate < today).length;
    const atRisk = weekTasks.filter(t => !t.done && !t.scheduled && t.dueDate >= today);
    const prevTaskStats = getWeekTaskStats(prevWeekStart, prevWeekEnd);

    const atRiskHtml = atRisk.length ? atRisk.map(t => `
      <div class="upcoming-item">
        <div class="day">${fmtDate(t.dueDate)}</div>
        <div style="flex:1"><div class="txt">${escapeHtml(t.text)}</div></div>
      </div>
    `).join('') : '<div class="upcoming-empty">Nothing at risk — everything pending has a slot.</div>';

    const dailyGoalsHtml = state.dailyGoals.map(g => {
      const stats = weekStatsForDailyGoal(g.id, dates);
      const prevStats = weekStatsForDailyGoal(g.id, prevDates);
      const streak = computeDailyGoalStreak(g.id);
      const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
      return `
        <div class="review-health-row">
          <div class="review-health-top">
            <span class="review-health-label">${escapeHtml(g.name)}</span>
            <span class="review-health-stat">${stats.done}/${stats.total} · ${streak}-day streak</span>
          </div>
          <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div>
          <div class="trend-row">${trendBadge(stats.done, prevStats.done)}</div>
        </div>
      `;
    }).join('');

    const weeklyGoalsHtml = state.weeklyGoals.map(g => {
      const count = getWeeklyGoalCount(g, weekStart);
      const prevCount = getWeeklyGoalCount(g, prevWeekStart);
      const pct = Math.min(100, Math.round((count / g.target) * 100));
      return `
        <div class="review-health-row">
          <div class="review-health-top">
            <span class="review-health-label">${escapeHtml(g.name)}</span>
            <span class="review-health-stat">${count}/${g.target}${g.auto ? ' · auto' : ''}</span>
          </div>
          <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div>
          <div class="trend-row">${trendBadge(count, prevCount)}</div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Week Review</div>
      <div class="modal-subtitle">${dates[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${dates[6].toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>

      <div class="review-stats-row">
        <div class="review-stat"><div class="review-stat-num">${weekTasks.length}</div><div class="review-stat-label">Due this week</div></div>
        <div class="review-stat"><div class="review-stat-num">${doneCount}</div><div class="review-stat-label">Done</div></div>
        <div class="review-stat"><div class="review-stat-num">${pendingCount}</div><div class="review-stat-label">Pending</div></div>
        <div class="review-stat"><div class="review-stat-num" style="color:${overdueCount ? '#F2617A' : 'inherit'}">${overdueCount}</div><div class="review-stat-label">Overdue</div></div>
      </div>
      <div class="trend-row" style="margin:-10px 0 14px; text-align:center;">Tasks done: ${trendBadge(doneCount, prevTaskStats.done)}</div>

      <div class="upcoming-section-title">At risk — no slot scheduled</div>
      <div class="upcoming-list">${atRiskHtml}</div>

      ${state.dailyGoals.length ? '<div class="upcoming-section-title" style="margin-top:16px">Daily habits</div>' + dailyGoalsHtml : ''}
      ${state.weeklyGoals.length ? '<div class="upcoming-section-title" style="margin-top:16px">Weekly habits</div>' + weeklyGoalsHtml : ''}

      <div class="modal-actions">
        <button class="cancel" id="reviewClose" style="flex:1">Close</button>
      </div>
    `;
    overlay.classList.remove('hidden');
    document.getElementById('reviewClose').onclick = closeModal;
  }

  function autoScheduleTasks(){
    const today = todayStr();
    const candidates = state.tasks
      .filter(t => !t.done && !t.scheduled && t.dueDate >= today)
      .sort((a,b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 1;
        const pb = PRIORITY_ORDER[b.priority] ?? 1;
        if(pa !== pb) return pa - pb;
        const pointsA = a.points ?? -1;
        const pointsB = b.points ?? -1;
        if(pointsA !== pointsB) return pointsB - pointsA; // higher points first
        return a.dueDate.localeCompare(b.dueDate);
      });

    const scheduled = [];
    const failed = [];

    candidates.forEach(t => {
      const result = attemptPlaceTask(t);
      if(result.placed) scheduled.push({ task: t, dateStr: result.dateStr, duration: result.duration });
      else failed.push(t);
    });

    save();
    renderAll();
    return { scheduled, failed };
  }

  function runAutoSchedule(){
    const { scheduled, failed } = autoScheduleTasks();
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');

    const scheduledHtml = scheduled.length ? scheduled.map(s => `
      <div class="upcoming-item">
        <div class="day">${s.dateStr === todayStr() ? 'Today' : fmtDate(s.dateStr)}</div>
        <div style="flex:1">
          <div class="txt">${escapeHtml(s.task.text)}</div>
          <div class="fixed-tag">${s.duration} min</div>
        </div>
      </div>
    `).join('') : '<div class="upcoming-empty">Nothing new to schedule.</div>';

    const failedHtml = failed.length ? failed.map(t => `
      <div class="upcoming-item">
        <div class="day">${fmtDate(t.dueDate)}</div>
        <div style="flex:1"><div class="txt">${escapeHtml(t.text)}</div></div>
      </div>
    `).join('') : '';

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Auto-schedule results</div>
      <div class="modal-subtitle">${scheduled.length} scheduled${failed.length ? ', ' + failed.length + " couldn't fit" : ''}</div>
      <div class="upcoming-section-title">Scheduled</div>
      <div class="upcoming-list">${scheduledHtml}</div>
      ${failed.length ? '<div class="upcoming-section-title">No open slot found</div><div class="upcoming-list">' + failedHtml + '</div>' : ''}
      <div class="modal-actions">
        <button class="cancel" id="schedResultClose" style="flex:1">Close</button>
      </div>
    `;
    overlay.classList.remove('hidden');
    document.getElementById('schedResultClose').onclick = closeModal;
  }

  function openDurationSettingsModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    renderDurationSettingsModal();
    overlay.classList.remove('hidden');
  }

  function renderDurationSettingsModal(){
    const content = document.getElementById('modalContent');
    const keys = Object.keys(state.taskDurations).filter(k => k !== '__default__').sort();
    const rowsHtml = keys.map(k => `
      <div class="dur-row" data-key="${escapeHtml(k)}">
        <span class="dur-key">${escapeHtml(k)}</span>
        <input type="number" class="dur-min" min="5" step="5" value="${state.taskDurations[k]}">
        <span class="dur-unit">min</span>
        <button class="dur-del">×</button>
      </div>
    `).join('');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Task durations</div>
      <div class="modal-subtitle">How long each type of task takes — used to size auto-scheduled blocks</div>
      <div class="dur-list">${rowsHtml}</div>
      <div class="dur-row dur-add-row">
        <input type="text" id="durNewKey" placeholder="keyword, e.g. lab report" style="flex:1">
        <input type="number" id="durNewMin" min="5" step="5" placeholder="min" style="width:60px">
        <button class="dur-add-btn" id="durAddBtn">Add</button>
      </div>
      <label style="margin-top:16px">Default (when nothing matches)</label>
      <input type="number" id="durDefault" min="5" step="5" value="${state.taskDurations['__default__'] || 30}">
      <div class="modal-actions">
        <button class="cancel" id="durClose" style="flex:1">Done</button>
      </div>
    `;

    content.querySelectorAll('.dur-min').forEach(inp => {
      inp.onchange = () => {
        const key = inp.closest('.dur-row').dataset.key;
        state.taskDurations[key] = Math.max(5, parseInt(inp.value, 10) || 5);
        save();
      };
    });
    content.querySelectorAll('.dur-del').forEach(btn => {
      btn.onclick = () => {
        const key = btn.closest('.dur-row').dataset.key;
        delete state.taskDurations[key];
        save();
        renderDurationSettingsModal();
      };
    });
    document.getElementById('durAddBtn').onclick = () => {
      const key = document.getElementById('durNewKey').value.trim().toLowerCase();
      const min = Math.max(5, parseInt(document.getElementById('durNewMin').value, 10) || 30);
      if(!key) return;
      state.taskDurations[key] = min;
      save();
      renderDurationSettingsModal();
    };
    document.getElementById('durDefault').onchange = (e) => {
      state.taskDurations['__default__'] = Math.max(5, parseInt(e.target.value, 10) || 30);
      save();
    };
    document.getElementById('durClose').onclick = closeModal;
  }

  function openEnergySettingsModal(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    renderEnergySettingsModal();
    overlay.classList.remove('hidden');
  }

  const ENERGY_LEVELS = ['high', 'medium', 'low'];
  const ENERGY_LABELS = { high:'High', medium:'Medium', low:'Low' };
  const ENERGY_COLORS = { high:'#3CBF8C', medium:'#F2A93B', low:'#F2617A' };

  function renderEnergySettingsModal(){
    const content = document.getElementById('modalContent');
    const rowsHtml = [];
    for(let h = START_HOUR; h <= END_HOUR; h++){
      const level = getEnergyLevel(h);
      rowsHtml.push(`
        <div class="energy-row" data-hour="${h}">
          <span class="energy-hour">${fmtTime(minToTime(h*60))}</span>
          <button class="energy-pill" style="--energy-color:${ENERGY_COLORS[level]}">${ENERGY_LABELS[level]}</button>
        </div>
      `);
    }
    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Energy levels</div>
      <div class="modal-subtitle">Tap an hour to cycle High → Medium → Low. Auto-schedule avoids Low hours when it can, and adding something manually into one will give you a heads up.</div>
      <div class="energy-list">${rowsHtml.join('')}</div>
      <div class="modal-actions">
        <button class="cancel" id="energyClose" style="flex:1">Done</button>
      </div>
    `;
    content.querySelectorAll('.energy-row').forEach(row => {
      row.querySelector('.energy-pill').onclick = () => {
        const hour = row.dataset.hour;
        const current = getEnergyLevel(hour);
        const nextIdx = (ENERGY_LEVELS.indexOf(current) + 1) % ENERGY_LEVELS.length;
        state.energyLevels[String(hour).padStart(2,'0')] = ENERGY_LEVELS[nextIdx];
        save();
        renderEnergySettingsModal();
      };
    });
    document.getElementById('energyClose').onclick = () => { closeModal(); renderAll(); };
  }

  function escapeHtml(s){
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ---------------- Legend + category options menu ---------------- */

  function renderLegend(){
    const wrap = document.getElementById('legend');
    wrap.innerHTML = '';
    CATEGORIES.forEach(c => {
      const active = filterCats.has(c.id);
      const item = document.createElement('div');
      item.className = 'legend-item' + (active ? ' selected' : ' dim');
      item.style.setProperty('--chip-color', c.color);

      const chip = document.createElement('button');
      chip.className = 'legend-chip';
      chip.innerHTML = '<span class="sw" style="background:'+c.color+'"></span>' + c.label;
      chip.onclick = () => {
        if(filterCats.has(c.id)){ filterCats.delete(c.id); } else { filterCats.add(c.id); }
        if(filterCats.size === 0) filterCats = new Set(CATEGORIES.map(x=>x.id));
        renderAll();
      };

      const ell = document.createElement('button');
      ell.className = 'legend-ellipsis';
      ell.textContent = '⋮';
      ell.onclick = (e) => { e.stopPropagation(); openCatMenu(c.id, ell); };

      item.appendChild(chip);
      item.appendChild(ell);
      wrap.appendChild(item);
    });
  }

  function openCatMenu(catId, anchorEl){
    menuOpenForCat = catId;
    const menu = document.getElementById('catMenu');
    const rect = anchorEl.getBoundingClientRect();
    menu.style.setProperty('--chip-color', catById[catId].color);
    const hasPresets = PRESET_EVENTS.some(p => p.category === catId);
    document.getElementById('catMenuQuickAdd').style.display = hasPresets ? 'flex' : 'none';
    menu.classList.remove('hidden');
    const menuWidth = 200;
    let left = rect.left;
    if(left + menuWidth > window.innerWidth - 12) left = window.innerWidth - menuWidth - 12;
    menu.style.left = Math.max(12, left) + 'px';
    menu.style.top = (rect.bottom + 6) + 'px';
  }
  function closeCatMenu(){
    menuOpenForCat = null;
    document.getElementById('catMenu').classList.add('hidden');
  }
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('catMenu');
    if(!menu.classList.contains('hidden') && !menu.contains(e.target)){
      closeCatMenu();
    }
  });

  document.getElementById('catMenuAddEvent').onclick = () => {
    const catId = menuOpenForCat;
    closeCatMenu();
    openAddEventModal(catId);
  };
  document.getElementById('catMenuAddTask').onclick = () => {
    const catId = menuOpenForCat;
    closeCatMenu();
    openAddTaskModal(catId);
  };
  document.getElementById('catMenuQuickAdd').onclick = () => {
    const catId = menuOpenForCat;
    closeCatMenu();
    openPresetModal(catId);
  };
  document.getElementById('catMenuUpcoming').onclick = () => {
    const catId = menuOpenForCat;
    closeCatMenu();
    openUpcomingModal(catId);
  };

  function buildMonthGrid(viewMonth){
    const year = viewMonth.getFullYear(), month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for(let i = startWeekday - 1; i >= 0; i--){
      cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), otherMonth: true });
    }
    for(let d = 1; d <= daysInMonth; d++){
      cells.push({ date: new Date(year, month, d), otherMonth: false });
    }
    let nextDay = 1;
    while(cells.length % 7 !== 0){
      cells.push({ date: new Date(year, month + 1, nextDay++), otherMonth: true });
    }
    return cells;
  }

  function openCalendarModal(){
    calendarViewMonth = new Date(weekAnchor.getFullYear(), weekAnchor.getMonth(), 1);
    renderCalendarModal();
    document.getElementById('modalOverlay').classList.remove('hidden');
  }

  function renderCalendarModal(){
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    const monthLabel = calendarViewMonth.toLocaleDateString('en-US', { month:'long', year:'numeric' });
    const cells = buildMonthGrid(calendarViewMonth);
    const todayStrVal = todayStr();
    const weekdayHeaders = ['S','M','T','W','T','F','S'];

    const gridHtml = cells.map(c => {
      const ds = toDateStr(c.date);
      const isToday = ds === todayStrVal;
      const cls = ['cal-day'];
      if(c.otherMonth) cls.push('other-month');
      if(isToday) cls.push('today');
      return '<button class="' + cls.join(' ') + '" data-date="' + ds + '">' + c.date.getDate() + '</button>';
    }).join('');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">Jump to a date</div>
      <div class="cal-header">
        <button class="cal-nav-btn" id="calPrevMonth">‹</button>
        <div class="cal-month-label">${monthLabel}</div>
        <button class="cal-nav-btn" id="calNextMonth">›</button>
      </div>
      <div class="cal-weekdays">${weekdayHeaders.map(w => '<span>'+w+'</span>').join('')}</div>
      <div class="cal-grid">${gridHtml}</div>
      <div class="cal-footer"><button class="cal-today-btn" id="calGoToday">Jump to today</button></div>
    `;

    document.getElementById('calPrevMonth').onclick = () => {
      calendarViewMonth.setMonth(calendarViewMonth.getMonth() - 1);
      renderCalendarModal();
    };
    document.getElementById('calNextMonth').onclick = () => {
      calendarViewMonth.setMonth(calendarViewMonth.getMonth() + 1);
      renderCalendarModal();
    };
    document.getElementById('calGoToday').onclick = () => selectCalendarDate(new Date());
    content.querySelectorAll('.cal-day').forEach(btn => {
      btn.onclick = () => {
        const [y,m,d] = btn.dataset.date.split('-').map(Number);
        selectCalendarDate(new Date(y, m - 1, d));
      };
    });
  }

  function selectCalendarDate(date){
    weekAnchor = startOfWeek(date);
    activeDay = date.getDay();
    closeModal();
    renderAll();
  }

  /* ---------------- Modals ---------------- */

  function closeModal(){
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('hidden');
    setTimeout(() => {
      if(overlay.classList.contains('hidden')){
        document.getElementById('modalContent').innerHTML = '';
      }
    }, 300);
  }
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if(e.target.id === 'modalOverlay') closeModal();
  });

  function fullDayName(abbr){
    const map = { Sun:'Sunday', Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday' };
    return map[abbr];
  }

  // Scheduled event — tied to a day + specific time, shows in Blocks/List
  // Finds the real (mutable) reference to an already-placed event — either
  // in the weekly-recurring store or the dated-events store.
  function findEventRef(it, day){
    if(it.__dated){
      const arr = state.datedEvents[it.__dateStr] || [];
      return arr.find(x => x.id === it.id);
    }
    return (state.items[day] || []).find(x => x.id === it.id);
  }

  function openEditEventModal(it, day){
    const ref = findEventRef(it, day);
    if(!ref) return;
    const cat = catById[ref.category] || CATEGORIES[0];
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.setProperty('--chip-color', cat.color);

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title"><span class="sw" style="background:${cat.color}"></span>Edit event</div>
      <div class="modal-subtitle">${it.__dated ? fmtDate(it.__dateStr) : fullDayName(day)}</div>
      <label>What is it?</label>
      <input type="text" id="editText" maxlength="80">
      <label>Time</label>
      <input type="time" id="editTime">
      <label>Notes (optional)</label>
      <textarea id="editNotes" placeholder="Any extra detail…" rows="2"></textarea>
      <div class="modal-actions">
        <button class="cancel" id="editCancel">Cancel</button>
        <button class="save" id="editSave">Save</button>
      </div>
    `;
    // Set values via JS (not template attributes) so quotes/special chars
    // in existing text can't break the markup.
    document.getElementById('editText').value = ref.text;
    document.getElementById('editTime').value = ref.time;
    document.getElementById('editNotes').value = ref.notes || '';

    overlay.classList.remove('hidden');
    document.getElementById('editCancel').onclick = closeModal;
    document.getElementById('editSave').onclick = () => {
      const text = document.getElementById('editText').value.trim();
      if(!text) return;
      ref.text = text;
      ref.time = document.getElementById('editTime').value || ref.time;
      ref.notes = document.getElementById('editNotes').value.trim();
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('editText').focus(), 50);
  }

  function openAddEventModal(catId){
    let selectedCat = catId || 'personal';
    const cat = catById[selectedCat];
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.setProperty('--chip-color', cat.color);

    const dayOptions = DAYS.map((d, i) => '<option value="'+d+'"'+(i===activeDay?' selected':'')+'>'+fullDayName(d)+'</option>').join('');
    const activeDateStr = toDateStr(weekDates()[activeDay]);
    const catPickerHtml = catId ? '' : '<label>Category</label><div class="cat-picker" id="evCatPicker"></div>';
    const titleDotHtml = catId ? '<span class="sw" style="background:'+cat.color+'"></span>' : '';

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">${titleDotHtml}Add event</div>
      <div class="modal-subtitle" id="evSubtitle">Scheduled at a specific time</div>

      ${catPickerHtml}
      <div id="evPresetShortcut"></div>

      <label class="allday-toggle-row">
        <input type="checkbox" id="evAllDay"> All day / multi-day (e.g. vacation)
      </label>

      <div id="evTimedFields">
        <label>Day</label>
        <select id="evDay">${dayOptions}</select>
        <label>Time</label>
        <input type="time" id="evTime" value="09:00">
        <div id="evEnergyWarn" class="energy-warn" style="display:none">⚡ This is one of your low-energy hours</div>
      </div>

      <div id="evAllDayFields" style="display:none">
        <label>Start date</label>
        <input type="date" id="evStartDate" value="${activeDateStr}">
        <label>End date</label>
        <input type="date" id="evEndDate" value="${activeDateStr}">
      </div>

      <label>What is it?</label>
      <input type="text" id="evText" placeholder="e.g. Doctor appointment" maxlength="80">
      <label>Notes (optional)</label>
      <textarea id="evNotes" placeholder="Any extra detail…" rows="2"></textarea>
      <div class="modal-actions">
        <button class="cancel" id="evCancel">Cancel</button>
        <button class="save" id="evSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    function updatePresetShortcut(){
      const box = document.getElementById('evPresetShortcut');
      if(!box) return;
      const hasPresets = PRESET_EVENTS.some(p => p.category === selectedCat);
      if(hasPresets){
        const c = catById[selectedCat];
        box.innerHTML = '<button class="preset-shortcut-btn">» Use a ' + escapeHtml(c.label) + ' preset instead</button>';
        box.querySelector('.preset-shortcut-btn').onclick = () => {
          closeModal();
          openPresetModal(selectedCat);
        };
      } else {
        box.innerHTML = '';
      }
    }
    updatePresetShortcut();

    const checkEnergyWarn = () => {
      const warnBox = document.getElementById('evEnergyWarn');
      if(!warnBox) return;
      const timeVal = document.getElementById('evTime').value;
      if(!timeVal){ warnBox.style.display = 'none'; return; }
      const hour = parseInt(timeVal.split(':')[0], 10);
      warnBox.style.display = getEnergyLevel(hour) === 'low' ? 'block' : 'none';
    };
    checkEnergyWarn();
    document.getElementById('evTime').addEventListener('change', checkEnergyWarn);

    if(!catId){
      renderCategoryPickerInline('evCatPicker', selectedCat, (c) => {
        selectedCat = c;
        content.style.setProperty('--chip-color', catById[c].color);
        updatePresetShortcut();
      });
    }

    document.getElementById('evAllDay').onchange = (e) => {
      const isAllDay = e.target.checked;
      document.getElementById('evTimedFields').style.display = isAllDay ? 'none' : 'block';
      document.getElementById('evAllDayFields').style.display = isAllDay ? 'block' : 'none';
      document.getElementById('evSubtitle').textContent = isAllDay
        ? "No specific time — shown as a banner, doesn't tint the schedule"
        : 'Scheduled at a specific time';
    };

    document.getElementById('evCancel').onclick = closeModal;
    document.getElementById('evSave').onclick = () => {
      const isAllDay = document.getElementById('evAllDay').checked;
      const text = document.getElementById('evText').value.trim();
      if(!text) return;
      const notes = document.getElementById('evNotes').value.trim();

      if(isAllDay){
        let startDate = document.getElementById('evStartDate').value || activeDateStr;
        let endDate = document.getElementById('evEndDate').value || startDate;
        if(endDate < startDate) endDate = startDate;
        state.allDayEvents.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,7), text, category: selectedCat, startDate, endDate, notes });
      } else {
        const day = document.getElementById('evDay').value;
        const time = document.getElementById('evTime').value || '09:00';
        state.items[day].push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,7), time, text, category: selectedCat, notes });
      }
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('evText').focus(), 50);
  }

  // Task — has a due date, no fixed time, shows in the Tasks section
  function openPresetModal(catId){
    const cat = catById[catId];
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.setProperty('--chip-color', cat.color);

    const presets = PRESET_EVENTS.filter(p => p.category === catId);
    const rowsHtml = presets.map(p => `
      <button class="preset-item" data-preset="${p.id}">
        <div class="preset-left">
          <div class="preset-label">${escapeHtml(p.label)}</div>
          <div class="preset-meta">${fullDayName(p.day)} · ${fmtTime(p.time)}${p.endTime ? '–' + fmtTime(p.endTime) : ''}</div>
        </div>
        <span class="preset-add">+</span>
      </button>
    `).join('');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title"><span class="sw" style="background:${cat.color}"></span>Quick add — ${cat.label}</div>
      <div class="modal-subtitle">Adds to this week's matching day, pre-filled</div>
      <div class="upcoming-list">${rowsHtml}</div>
      <div class="modal-actions">
        <button class="cancel" id="presetClose" style="flex:1">Close</button>
      </div>
    `;
    overlay.classList.remove('hidden');
    document.getElementById('presetClose').onclick = closeModal;
    content.querySelectorAll('.preset-item').forEach(btn => {
      btn.onclick = () => {
        const preset = PRESET_EVENTS.find(p => p.id === btn.dataset.preset);
        if(preset) addPresetEvent(preset);
      };
    });
  }

  function addPresetEvent(preset){
    state.items[preset.day].push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
      time: preset.time,
      endTime: preset.endTime || null,
      text: preset.label,
      category: preset.category
    });
    save();
    activeDay = DAYS.indexOf(preset.day);
    closeModal();
    renderAll();
  }

  function openAddTaskModal(catId){
    let selectedCat = catId || 'personal';
    const cat = catById[selectedCat];
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.setProperty('--chip-color', cat.color);
    refreshClassSuggestions();

    const catPickerHtml = catId ? '' : '<label>Category</label><div class="cat-picker" id="taskCatPicker"></div>';
    const titleDotHtml = catId ? '<span class="sw" style="background:'+cat.color+'"></span>' : '';

    function projectOptionsHtml(forCat){
      const opts = state.projects.filter(p => p.category === forCat);
      if(!opts.length) return '<option value="">None</option>';
      return '<option value="">None</option>' + opts.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>').join('');
    }

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">${titleDotHtml}Add task</div>
      <div class="modal-subtitle">Due on a date — no specific time</div>
      ${catPickerHtml}
      <div id="taskClassField" style="display:${selectedCat === 'school' ? 'block' : 'none'}">
        <label>Class</label>
        <input type="text" id="taskClass" list="classSuggestions" placeholder="e.g. Biology 101">
      </div>
      <label>Project (optional)</label>
      <select id="taskProject">${projectOptionsHtml(selectedCat)}</select>
      <label>Due date</label>
      <input type="date" id="taskDue" value="${todayStr()}">
      <label>What is it?</label>
      <input type="text" id="taskText" placeholder="e.g. Chapter 4 reading response" maxlength="80">
      <label>Points (optional)</label>
      <input type="number" id="taskPoints" min="0" step="0.5" placeholder="e.g. 100">
      <label>Priority</label>
      <div class="cat-picker" id="taskPriorityPicker"></div>
      <label>Notes (optional)</label>
      <textarea id="taskNotes" placeholder="Any extra detail…" rows="2"></textarea>
      <div class="modal-actions">
        <button class="cancel" id="taskCancel">Cancel</button>
        <button class="save" id="taskSave">Save</button>
      </div>
    `;
    overlay.classList.remove('hidden');
    let modalPriority = 'normal';
    renderPriorityPicker('taskPriorityPicker', modalPriority, (p) => { modalPriority = p; });

    if(!catId){
      renderCategoryPickerInline('taskCatPicker', selectedCat, (c) => {
        selectedCat = c;
        content.style.setProperty('--chip-color', catById[c].color);
        document.getElementById('taskClassField').style.display = c === 'school' ? 'block' : 'none';
        document.getElementById('taskProject').innerHTML = projectOptionsHtml(c);
      });
    }

    document.getElementById('taskCancel').onclick = closeModal;
    document.getElementById('taskSave').onclick = () => {
      const dueDate = document.getElementById('taskDue').value || todayStr();
      const text = document.getElementById('taskText').value.trim();
      if(!text) return;
      const subcategory = selectedCat === 'school' ? document.getElementById('taskClass').value.trim() : '';
      const pointsRaw = document.getElementById('taskPoints').value;
      const points = pointsRaw !== '' ? Math.max(0, parseFloat(pointsRaw) || 0) : null;
      const notes = document.getElementById('taskNotes').value.trim();
      const projectId = document.getElementById('taskProject').value || null;
      state.tasks.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,7), text, category: selectedCat, subcategory, dueDate, priority: modalPriority, points, notes, projectId, done:false });
      save();
      closeModal();
      renderAll();
    };
    setTimeout(() => document.getElementById('taskText').focus(), 50);
  }

  function openUpcomingModal(catId){
    const cat = catById[catId];
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.setProperty('--chip-color', cat.color);

    const dates = weekDates();
    const todayIdx = new Date().getDay();
    const order = [];
    for(let i=0;i<7;i++) order.push((todayIdx + i) % 7);

    // Scheduled events (this week, rolling from today)
    const rows = [];
    order.forEach(dayIdx => {
      const dayAbbr = DAYS[dayIdx];
      const dateStr = toDateStr(dates[dayIdx]);
      const dateLabel = dates[dayIdx].toLocaleDateString('en-US', { month:'short', day:'numeric' });

      blocksForDate(dayAbbr, dateStr).forEach(b => {
        if(b.category !== catId) return;
        if(state.workOff[b.id + '_' + dateStr]) return;
        rows.push({ dayAbbr, dateLabel, time: b.start, text: b.label, fixed: true });
      });

      state.items[dayAbbr].filter(it => it.category === catId).forEach(it => {
        rows.push({ dayAbbr, dateLabel, time: it.time, text: it.text, fixed: false });
      });
    });
    const dayRank = Object.fromEntries(order.map((d,i) => [DAYS[d], i]));
    rows.sort((a,b) => {
      const r = dayRank[a.dayAbbr] - dayRank[b.dayAbbr];
      if(r !== 0) return r;
      return a.time.localeCompare(b.time);
    });
    const eventsHtml = rows.length ? rows.map(r => `
      <div class="upcoming-item">
        <div class="day">${r.dayAbbr}<span class="date">${r.dateLabel}</span></div>
        <div style="flex:1">
          <div class="txt">${escapeHtml(r.text)}</div>
          <div class="time">${fmtTime(r.time)}</div>
          ${r.fixed ? '<div class="fixed-tag">Recurring</div>' : ''}
        </div>
      </div>
    `).join('') : '<div class="upcoming-empty">Nothing scheduled in ' + cat.label + ' this week.</div>';

    // Tasks — not tied to a week, sorted by due date, pending only
    const today = todayStr();
    const pendingTasks = state.tasks
      .filter(t => t.category === catId && !t.done)
      .sort((a,b) => a.dueDate.localeCompare(b.dueDate));

    function renderTaskRow(t){
      const overdue = t.dueDate < today;
      return `
        <div class="upcoming-item">
          <div class="day">${overdue ? 'Overdue' : fmtDate(t.dueDate)}</div>
          <div style="flex:1">
            <div class="txt">${escapeHtml(t.text)}</div>
            <div class="fixed-tag${overdue ? ' overdue' : ''}">${overdue ? 'Was due ' + fmtDate(t.dueDate) : 'Due ' + fmtDate(t.dueDate)}</div>
          </div>
        </div>
      `;
    }

    let tasksHtml;
    if(!pendingTasks.length){
      tasksHtml = '<div class="upcoming-empty">No pending tasks in ' + cat.label + '.</div>';
    } else if(catId === 'school'){
      const bySub = {};
      pendingTasks.forEach(t => {
        const key = t.subcategory && t.subcategory.trim() ? t.subcategory.trim() : 'General';
        if(!bySub[key]) bySub[key] = [];
        bySub[key].push(t);
      });
      const subKeys = Object.keys(bySub).sort((a,b) => {
        if(a === 'General') return 1;
        if(b === 'General') return -1;
        return a.localeCompare(b);
      });
      tasksHtml = subKeys.map(sub => `
        <div class="upcoming-section-title" style="margin-top:10px">${escapeHtml(sub)}</div>
        <div class="upcoming-list">${bySub[sub].map(renderTaskRow).join('')}</div>
      `).join('');
    } else {
      tasksHtml = pendingTasks.map(renderTaskRow).join('');
    }

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title"><span class="sw" style="background:${cat.color}"></span>Upcoming — ${cat.label}</div>
      <div class="upcoming-section-title">Tasks</div>
      ${catId === 'school' ? tasksHtml : '<div class="upcoming-list">' + tasksHtml + '</div>'}
      <div class="upcoming-section-title" style="margin-top:16px">Scheduled this week</div>
      <div class="upcoming-list">${eventsHtml}</div>
      <div class="modal-actions">
        <button class="cancel" id="upcomingClose" style="flex:1">Close</button>
      </div>
    `;
    overlay.classList.remove('hidden');
    document.getElementById('upcomingClose').onclick = closeModal;
  }

  /* ---------------- Category picker (add bar, for events) ---------------- */

  // Generic category picker — renders Work/School/Health/Personal/Faith
  // chips into any container, used inside modals opened without a
  // pre-chosen category (i.e. from the floating + button).
  function renderCategoryPickerInline(containerId, selected, onChange){
    const wrap = document.getElementById(containerId);
    if(!wrap) return;
    wrap.innerHTML = '';
    CATEGORIES.forEach(c => {
      const opt = document.createElement('button');
      opt.className = 'cat-option' + (selected === c.id ? ' selected' : '');
      opt.style.color = selected === c.id ? c.color : '';
      opt.innerHTML = '<span class="sw" style="background:'+c.color+'"></span>' + c.label;
      opt.onclick = () => {
        renderCategoryPickerInline(containerId, c.id, onChange);
        onChange(c.id);
      };
      wrap.appendChild(opt);
    });
  }

  function refreshClassSuggestions(){
    const list = document.getElementById('classSuggestions');
    const names = [...new Set(state.tasks.filter(t => t.category === 'school' && t.subcategory).map(t => t.subcategory))].sort();
    list.innerHTML = names.map(n => '<option value="' + escapeHtml(n) + '">').join('');
  }

  const PRIORITY_OPTIONS = [
    { id:'low',    label:'Low',    color:'#8B93A0' },
    { id:'normal', label:'Normal', color:'#5B8DEF' },
    { id:'high',   label:'High',   color:'#F2617A' },
  ];

  // Renders a row of Low/Normal/High pills into any container id. Calls
  // onChange(priorityId) when the selection changes.
  function renderPriorityPicker(containerId, selected, onChange){
    const wrap = document.getElementById(containerId);
    if(!wrap) return;
    wrap.innerHTML = '';
    PRIORITY_OPTIONS.forEach(p => {
      const opt = document.createElement('button');
      opt.className = 'cat-option' + (selected === p.id ? ' selected' : '');
      opt.style.color = selected === p.id ? p.color : '';
      opt.innerHTML = '<span class="sw" style="background:'+p.color+'"></span>' + p.label;
      opt.onclick = () => {
        renderPriorityPicker(containerId, p.id, onChange);
        onChange(p.id);
      };
      wrap.appendChild(opt);
    });
  }

  /* ---------------- Day tabs ---------------- */

  function renderTabs(){
    const wrap = document.getElementById('dayTabs');
    wrap.innerHTML = '';
    const dates = weekDates();

    DAYS.forEach((d, i) => {
      const dt = dates[i];
      const dateStr = toDateStr(dt);
      const btn = document.createElement('button');
      btn.className = 'day-tab' + (i === activeDay ? ' active' : '');
      const dayCats = new Set(state.items[d].map(it => it.category));
      blocksForDate(d, dateStr).forEach(b => {
        if(!state.workOff[b.id + '_' + dateStr]) dayCats.add(b.category);
      });
      state.tasks.filter(t => t.dueDate === dateStr && !t.done).forEach(t => dayCats.add(t.category));
      (state.datedEvents[dateStr] || []).forEach(it => dayCats.add(it.category));
      allDayEventsForDate(dateStr).forEach(it => dayCats.add(it.category));
      const dots = [...dayCats].slice(0,3).map(cid => '<span style="background:'+(catById[cid]?catById[cid].color:'#888')+'"></span>').join('');
      btn.innerHTML = d + '<span class="n">' + dt.getDate() + '</span><div class="day-dots">' + dots + '</div>';
      btn.onclick = () => { activeDay = i; renderAll(); };
      wrap.appendChild(btn);
    });
  }

  function allDayEventsForDate(dateStr){
    return state.allDayEvents.filter(e => dateStr >= e.startDate && dateStr <= e.endDate);
  }

  function renderAllDayBanners(){
    const wrap = document.getElementById('allDayBanners');
    wrap.innerHTML = '';
    const dateStr = toDateStr(weekDates()[activeDay]);
    const events = allDayEventsForDate(dateStr).filter(e => filterCats.has(e.category));

    events.forEach(e => {
      const cat = catById[e.category] || CATEGORIES[0];
      const multiDay = e.startDate !== e.endDate;
      const chip = document.createElement('div');
      chip.className = 'allday-chip';
      chip.style.setProperty('--accent-color', cat.color);
      chip.innerHTML = `
        <div class="allday-left">
          <span class="allday-badge">All day</span>
          <div>
            <div class="allday-text">${escapeHtml(e.text)}</div>
            ${multiDay ? '<div class="allday-range">' + fmtDate(e.startDate) + ' – ' + fmtDate(e.endDate) + '</div>' : ''}
            ${e.notes ? '<div class="event-notes">' + escapeHtml(e.notes) + '</div>' : ''}
          </div>
        </div>
        <button class="allday-del">×</button>
      `;
      chip.querySelector('.allday-del').onclick = () => {
        state.allDayEvents = state.allDayEvents.filter(x => x.id !== e.id);
        save();
        renderAll();
      };
      wrap.appendChild(chip);
    });
  }

  function renderFixedBanners(){
    const wrap = document.getElementById('fixedBanners');
    wrap.innerHTML = '';
    const day = DAYS[activeDay];
    const dates = weekDates();
    const dateStr = toDateStr(dates[activeDay]);
    const blocks = blocksForDate(day, dateStr);

    blocks.forEach(b => {
      const cat = catById[b.category];
      const offKey = b.id + '_' + dateStr;
      const isOff = !!state.workOff[offKey];

      const banner = document.createElement('div');
      banner.className = 'fixed-banner' + (isOff ? ' off' : '');
      banner.style.setProperty('--accent-color', cat.color);

      const top = document.createElement('div');
      top.className = 'fb-top';
      top.innerHTML = '<div class="fb-left"><div class="fb-title"></div><div class="fb-time"></div></div><div class="fb-right"></div>';
      top.querySelector('.fb-title').textContent = b.label;
      top.querySelector('.fb-time').textContent = isOff
        ? 'Marked off · ' + fmtTime(b.start) + '–' + fmtTime(b.end)
        : fmtTime(b.start) + ' – ' + fmtTime(b.end);

      const right = top.querySelector('.fb-right');

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'fb-toggle';
      toggleBtn.textContent = isOff ? 'Restore' : 'Day off';
      toggleBtn.onclick = () => {
        if(isOff){ delete state.workOff[offKey]; } else { state.workOff[offKey] = true; }
        save();
        renderAll();
      };
      right.appendChild(toggleBtn);

      banner.appendChild(top);
      wrap.appendChild(banner);
    });
  }

  /* ---------------- Tasks section (due date, shown on the active day) ---------------- */

  function renderTaskSection(){
    const wrap = document.getElementById('taskSection');
    wrap.innerHTML = '';
    const dates = weekDates();
    const dateStr = toDateStr(dates[activeDay]);
    const isToday = dateStr === todayStr();

    let tasks;
    if(taskSubView === 'upcoming'){
      tasks = state.tasks
        .filter(t => filterCats.has(t.category) && !t.done)
        .sort((a,b) => {
          if(a.done !== b.done) return a.done ? 1 : -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
    } else {
      tasks = state.tasks
        .filter(t => filterCats.has(t.category))
        .filter(t => t.dueDate === dateStr || (isToday && t.dueDate < dateStr && !t.done))
        .sort((a,b) => {
          if(a.done !== b.done) return a.done ? 1 : -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
    }

    // Scheduling controls
    const schedRow = document.createElement('div');
    schedRow.className = 'sched-row';
    schedRow.innerHTML = `
      <button class="sched-btn primary" id="btnAutoSchedule">▶ Auto-schedule tasks</button>
      <button class="sched-btn" id="btnDurations">⚙ Durations</button>
      <button class="sched-btn" id="btnEnergy">⚡ Energy</button>
    `;
    wrap.appendChild(schedRow);
    schedRow.querySelector('#btnAutoSchedule').onclick = runAutoSchedule;
    schedRow.querySelector('#btnDurations').onclick = openDurationSettingsModal;
    schedRow.querySelector('#btnEnergy').onclick = openEnergySettingsModal;

    // Sub-toggle: Today vs Upcoming
    const subToggle = document.createElement('div');
    subToggle.className = 'view-toggle';
    subToggle.style.margin = '0 0 12px';
    subToggle.innerHTML = `
      <button id="taskSubToday" class="${taskSubView === 'today' ? 'active' : ''}">Today</button>
      <button id="taskSubUpcoming" class="${taskSubView === 'upcoming' ? 'active' : ''}">Upcoming</button>
    `;
    wrap.appendChild(subToggle);
    subToggle.querySelector('#taskSubToday').onclick = () => { taskSubView = 'today'; renderTaskSection(); };
    subToggle.querySelector('#taskSubUpcoming').onclick = () => { taskSubView = 'upcoming'; renderTaskSection(); };

    if(!tasks.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = taskSubView === 'upcoming'
        ? 'No pending tasks — add one below.'
        : 'Nothing due — add a task below.';
      wrap.appendChild(empty);
      return;
    }

    renderGroupedTaskList(wrap, tasks, renderTaskSection);
  }

  // Shared by the Tasks tab and the Dashboard's "Due Today" card — renders
  // tasks grouped into collapsible category/project sections. onCollapseChange
  // is called just for the (cheap) collapse toggle; check/delete/reschedule
  // always trigger a full renderAll() since those affect other tabs too.
  function renderGroupedTaskList(wrap, tasks, onCollapseChange){
    const groups = groupTasksBySection(tasks);

    groups.forEach(group => {
      const isCollapsed = !expandedGroups.has(group.label);
      const title = document.createElement('div');
      title.className = 'task-section-title' + (isCollapsed ? ' collapsed' : '');
      title.style.color = group.color;
      title.innerHTML = '<span class="chev">▾</span><span>' + escapeHtml(group.label) + '</span><span class="grp-count">(' + group.items.length + ')</span>';
      title.onclick = () => {
        if(expandedGroups.has(group.label)){ expandedGroups.delete(group.label); }
        else { expandedGroups.add(group.label); }
        onCollapseChange();
      };
      wrap.appendChild(title);

      if(isCollapsed) return;

      const list = document.createElement('div');
      list.className = 'task-list';

      group.items.forEach(t => {
        const cat = catById[t.category] || CATEGORIES[0];
        const overdue = t.dueDate < todayStr() && !t.done;
        const priority = t.priority || 'normal';
        const row = document.createElement('div');
        row.className = 'task-item' + (t.done ? ' done' : '');
        row.style.setProperty('--accent-color', cat.color);
        const rescheduleBtnHtml = t.scheduled ? '<button class="task-resched" title="Reschedule">↻</button>' : '';
        row.innerHTML = '<button class="task-check">✓</button><div class="task-body"><div class="task-txt"></div><div class="task-meta"></div>' + (t.notes ? '<div class="event-notes"></div>' : '') + '</div>' + rescheduleBtnHtml + '<button class="task-del">×</button>';
        const txtEl = row.querySelector('.task-txt');
        if(priority === 'high') txtEl.innerHTML = '<span class="priority-dot high"></span>' + escapeHtml(t.text);
        else if(priority === 'low') txtEl.innerHTML = '<span class="priority-dot low"></span>' + escapeHtml(t.text);
        else txtEl.textContent = t.text;
        if(t.notes) row.querySelector('.event-notes').textContent = t.notes;
        const meta = row.querySelector('.task-meta');
        let metaText = taskSubView === 'upcoming'
          ? (overdue ? 'was due ' + fmtDate(t.dueDate) : 'due ' + fmtDate(t.dueDate))
          : (overdue ? 'was due ' + fmtDate(t.dueDate) : '');
        if(t.points !== null && t.points !== undefined){
          metaText += (metaText ? ' · ' : '') + t.points + ' pts';
        }
        if(t.scheduled){
          const link = findLinkedEvent(t.id);
          if(link){
            const when = link.dateStr === todayStr() ? 'today' : fmtDate(link.dateStr);
            metaText += (metaText ? ' · ' : '') + 'scheduled ' + when + ' ' + fmtTime(link.event.time);
          }
        }
        meta.textContent = metaText;
        if(overdue) meta.classList.add('overdue');
        row.querySelector('.task-check').onclick = () => {
          t.done = !t.done;
          save();
          renderAll();
        };
        const reschedBtn = row.querySelector('.task-resched');
        if(reschedBtn){
          reschedBtn.onclick = () => {
            clearTaskSchedule(t);
            attemptPlaceTask(t);
            save();
            renderAll();
          };
        }
        row.querySelector('.task-del').onclick = () => {
          if(t.scheduled) clearTaskSchedule(t);
          state.tasks = state.tasks.filter(x => x.id !== t.id);
          save();
          renderAll();
        };
        list.appendChild(row);
      });

      wrap.appendChild(list);
    });
  }

  // Groups a task list into display sections — one per category, with School
  // further split into one section per class (subcategory).
  function groupTasksBySection(tasks){
    const sections = [];
    CATEGORIES.forEach(cat => {
      const inCat = tasks.filter(t => t.category === cat.id);
      if(!inCat.length) return;

      const withProject = inCat.filter(t => t.projectId);
      const withoutProject = inCat.filter(t => !t.projectId);

      // Project-linked tasks get their own "[Category] — [Project]" header,
      // same visual pattern as School's per-class grouping, but works for
      // any category.
      const byProject = {};
      withProject.forEach(t => {
        if(!byProject[t.projectId]) byProject[t.projectId] = [];
        byProject[t.projectId].push(t);
      });
      Object.keys(byProject).forEach(pid => {
        const project = state.projects.find(p => p.id === pid);
        const label = cat.label + ' — ' + (project ? project.name : 'Deleted project');
        sections.push({ label, color: cat.color, items: byProject[pid] });
      });

      if(cat.id === 'school'){
        const bySub = {};
        withoutProject.forEach(t => {
          const key = t.subcategory && t.subcategory.trim() ? t.subcategory.trim() : 'General';
          if(!bySub[key]) bySub[key] = [];
          bySub[key].push(t);
        });
        Object.keys(bySub).sort((a,b) => {
          if(a === 'General') return 1;
          if(b === 'General') return -1;
          return a.localeCompare(b);
        }).forEach(sub => {
          sections.push({ label: cat.label + ' — ' + sub, color: cat.color, items: bySub[sub] });
        });
      } else if(withoutProject.length){
        sections.push({ label: cat.label, color: cat.color, items: withoutProject });
      }
    });
    return sections;
  }

  function visibleItems(day){
    const weekly = state.items[day].filter(it => filterCats.has(it.category));
    const dateStr = toDateStr(weekDates()[activeDay]);
    const dated = (state.datedEvents[dateStr] || [])
      .filter(it => filterCats.has(it.category))
      .map(it => Object.assign({}, it, { __dated: true, __dateStr: dateStr }));
    return weekly.concat(dated);
  }

  function activeFixedBlocksForHours(){
    const day = DAYS[activeDay];
    const dates = weekDates();
    const dateStr = toDateStr(dates[activeDay]);
    return blocksForDate(day, dateStr).filter(b => {
      if(state.workOff[b.id + '_' + dateStr]) return false;
      if(!filterCats.has(b.category)) return false;
      return true;
    });
  }

  function fmtTimeFromDate(d){
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return fmtTime(hh + ':' + mm);
  }

  function updateNowLine(){
    const wrap = document.getElementById('blockView');
    if(!wrap) return;
    let line = document.getElementById('nowLine');
    if(wrap.offsetParent === null){
      // Blocks tab isn't visible right now — leave any existing line as-is,
      // it'll be repositioned next time this tab becomes active.
      return;
    }

    const dates = weekDates();
    const dayDateStr = toDateStr(dates[activeDay]);
    const now = new Date();
    const isRealToday = dayDateStr === todayStr();
    const hour = now.getHours(), min = now.getMinutes();

    if(!isRealToday || hour < START_HOUR || hour > END_HOUR){
      if(line) line.remove();
      return;
    }

    const row = wrap.querySelector('.hour-row[data-hour="' + hour + '"]');
    if(!row){ if(line) line.remove(); return; }

    const rowRect = row.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const top = (rowRect.top - wrapRect.top) + (min / 60) * rowRect.height;

    if(!line){
      line = document.createElement('div');
      line.id = 'nowLine';
      line.className = 'now-line';
      line.innerHTML = '<span class="now-dot"></span><span class="now-time"></span>';
      wrap.appendChild(line);
    }
    line.style.top = top + 'px';
    line.querySelector('.now-time').textContent = fmtTimeFromDate(now);
  }

  function renderBlockView(){
    const day = DAYS[activeDay];
    const items = visibleItems(day).slice().sort((a,b) => a.time.localeCompare(b.time));
    const fixedBlocks = activeFixedBlocksForHours();
    const spanItems = items.filter(it => it.endTime).map(it => ({ start: it.time, end: it.endTime, category: it.category }));
    const allSpans = fixedBlocks.concat(spanItems);

    const wrap = document.getElementById('blockView');
    wrap.innerHTML = '';

    for(let h = START_HOUR; h <= END_HOUR; h++){
      const row = document.createElement('div');
      row.className = 'hour-row';
      row.dataset.hour = h;

      const label = document.createElement('div');
      label.className = 'hour-label' + (getEnergyLevel(h) === 'low' ? ' low-energy' : '');
      const ap = h >= 12 ? 'PM' : 'AM';
      let h12 = h % 12; if(h12 === 0) h12 = 12;
      label.textContent = h12 + ap;
      row.appendChild(label);

      const slot = document.createElement('div');
      slot.className = 'hour-slot';

      const hourStartMin = h * 60;
      const hourEndMin = hourStartMin + 60;
      const overlapping = allSpans.find(b => {
        const bStart = timeToMin(b.start), bEnd = timeToMin(b.end);
        return bStart < hourEndMin && bEnd > hourStartMin;
      });
      if(overlapping){
        const color = catById[overlapping.category].color;
        slot.style.background = 'color-mix(in srgb, ' + color + ' 35%, transparent)';
        slot.style.borderTopColor = 'color-mix(in srgb, ' + color + ' 45%, var(--border))';
      }

      const hourStr = String(h).padStart(2,'0');
      const hourItems = items.filter(it => it.time.startsWith(hourStr));

      if(hourItems.length){
        hourItems.forEach(it => {
          const cat = catById[it.category] || CATEGORIES[0];
          const ev = document.createElement('div');
          ev.className = 'block-event';
          ev.style.setProperty('--accent-color', cat.color);
          ev.innerHTML = '<div><div class="txt"></div><div class="time"></div>' + (it.notes ? '<div class="event-notes"></div>' : '') + '</div><button class="del">×</button>';
          ev.querySelector('.txt').textContent = it.text;
          const timeLabel = it.endTime ? (fmtTime(it.time) + '–' + fmtTime(it.endTime)) : fmtTime(it.time);
          ev.querySelector('.time').textContent = timeLabel + ' · ' + cat.label;
          if(it.notes) ev.querySelector('.event-notes').textContent = it.notes;
          ev.querySelector('.del').onclick = (e) => { e.stopPropagation(); removeItem(day, it.id); };
          ev.addEventListener('click', () => openEditEventModal(it, day));
          slot.appendChild(ev);
        });
      } else {
        const addBtn = document.createElement('button');
        addBtn.className = 'add-slot-btn';
        addBtn.textContent = '+';
        addBtn.onclick = () => {
          openAddEventModal(null);
          setTimeout(() => {
            const timeInput = document.getElementById('evTime');
            if(timeInput) timeInput.value = hourStr + ':00';
          }, 60);
        };
        slot.appendChild(addBtn);
      }

      row.appendChild(slot);
      wrap.appendChild(row);
    }
    requestAnimationFrame(updateNowLine);
  }

  function renderListView(){
    const day = DAYS[activeDay];
    const items = visibleItems(day).slice().sort((a,b) => a.time.localeCompare(b.time));
    const wrap = document.getElementById('listView');
    wrap.innerHTML = '';

    if(!items.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'Nothing scheduled yet — add something below.';
      wrap.appendChild(empty);
      return;
    }

    items.forEach(it => {
      const cat = catById[it.category] || CATEGORIES[0];
      const row = document.createElement('div');
      row.className = 'list-item';
      row.style.setProperty('--accent-color', cat.color);
      row.innerHTML = '<div class="time"></div><div style="flex:1"><div class="txt"></div><div class="cat"></div>' + (it.notes ? '<div class="event-notes"></div>' : '') + '</div><button class="del">×</button>';
      row.querySelector('.time').textContent = it.endTime ? (fmtTime(it.time) + '–' + fmtTime(it.endTime)) : fmtTime(it.time);
      row.querySelector('.txt').textContent = it.text;
      row.querySelector('.cat').textContent = cat.label;
      row.querySelector('.cat').style.color = cat.color;
      if(it.notes) row.querySelector('.event-notes').textContent = it.notes;
      row.querySelector('.del').onclick = (e) => { e.stopPropagation(); removeItem(day, it.id); };
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => openEditEventModal(it, day));
      wrap.appendChild(row);
    });
  }

  function renderTodayView(){
    const wrap = document.getElementById('todayView');
    wrap.innerHTML = '';
    const dayAbbr = DAYS[activeDay];
    const dateStr = toDateStr(weekDates()[activeDay]);
    const isReallyToday = dateStr === todayStr();

    const heading = document.createElement('div');
    heading.className = 'section-label';
    heading.style.marginBottom = '10px';
    heading.textContent = (isReallyToday ? 'Today · ' : '') + fmtDate(dateStr);
    wrap.appendChild(heading);

    // Tasks due this day
    const dueTasks = state.tasks.filter(t => filterCats.has(t.category) && t.dueDate === dateStr);
    if(dueTasks.length){
      const title = document.createElement('div');
      title.className = 'task-section-title';
      title.style.cursor = 'default';
      title.innerHTML = '<span>Due</span>';
      wrap.appendChild(title);
      const list = document.createElement('div');
      list.className = 'task-list';
      list.style.marginBottom = '16px';
      dueTasks.forEach(t => {
        const cat = catById[t.category] || CATEGORIES[0];
        const row = document.createElement('div');
        row.className = 'task-item' + (t.done ? ' done' : '');
        row.style.setProperty('--accent-color', cat.color);
        row.innerHTML = '<button class="task-check">✓</button><div class="task-body"><div class="task-txt"></div><div class="task-meta"></div></div>';
        row.querySelector('.task-txt').textContent = t.text;
        row.querySelector('.task-meta').textContent = cat.label + (t.subcategory ? ' · ' + t.subcategory : '');
        row.querySelector('.task-check').onclick = () => { t.done = !t.done; save(); renderAll(); };
        list.appendChild(row);
      });
      wrap.appendChild(list);
    }

    // Chronological timeline: fixed blocks + weekly/dated events
    const fixed = blocksForDate(dayAbbr, dateStr)
      .filter(b => filterCats.has(b.category))
      .map(b => ({
        time: b.start, endTime: b.end, text: b.label, category: b.category,
        fixed: true, off: !!state.workOff[b.id + '_' + dateStr]
      }));
    const events = visibleItems(dayAbbr).map(it => Object.assign({}, it, { fixed: false }));
    const timeline = fixed.concat(events).sort((a,b) => timeToMin(a.time) - timeToMin(b.time));

    const timelineTitle = document.createElement('div');
    timelineTitle.className = 'task-section-title';
    timelineTitle.style.cursor = 'default';
    timelineTitle.innerHTML = '<span>Timeline</span>';
    wrap.appendChild(timelineTitle);

    if(!timeline.length){
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'Nothing on the calendar for this day.';
      wrap.appendChild(empty);
      return;
    }

    timeline.forEach(it => {
      const cat = catById[it.category] || CATEGORIES[0];
      const row = document.createElement('div');
      row.className = 'list-item' + (it.off ? '' : '');
      row.style.setProperty('--accent-color', it.off ? '#565E68' : cat.color);
      const label = it.off ? it.text + ' (off)' : it.text;
      row.innerHTML = '<div class="time"></div><div style="flex:1"><div class="txt"></div><div class="cat"></div>' + (it.notes ? '<div class="event-notes"></div>' : '') + '</div>' + (it.fixed ? '' : '<button class="del">×</button>');
      row.querySelector('.time').textContent = it.endTime ? (fmtTime(it.time) + '–' + fmtTime(it.endTime)) : fmtTime(it.time);
      row.querySelector('.txt').textContent = label;
      row.querySelector('.cat').textContent = cat.label + (it.fixed ? ' · fixed' : '');
      row.querySelector('.cat').style.color = it.off ? '#565E68' : cat.color;
      if(it.notes) row.querySelector('.event-notes').textContent = it.notes;
      if(!it.fixed){
        row.querySelector('.del').onclick = (e) => { e.stopPropagation(); removeItem(dayAbbr, it.id); };
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => openEditEventModal(it, dayAbbr));
      }
      wrap.appendChild(row);
    });
  }

  function removeItem(day, id){
    for(const dateKey in state.datedEvents){
      const idx = state.datedEvents[dateKey].findIndex(it => it.id === id);
      if(idx > -1){
        state.datedEvents[dateKey].splice(idx, 1);
        save();
        renderAll();
        return;
      }
    }
    state.items[day] = state.items[day].filter(it => it.id !== id);
    save();
    renderAll();
  }

  const OVERFLOW_SECTIONS = [
    { id:'lists',     icon:'☰', label:'Lists' },
    { id:'longgoals', icon:'✦', label:'Goals' },
    { id:'fitness',   icon:'⚡', label:'Fitness' },
    { id:'budget',    icon:'$', label:'Budget' },
    { id:'projects',  icon:'◈', label:'Projects' },
    { id:'journal',   icon:'✎', label:'Journal' },
  ];

  function openMoreSheet(){
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.style.removeProperty('--chip-color');
    const gridHtml = OVERFLOW_SECTIONS.map(s =>
      '<button class="more-grid-item" data-go="' + s.id + '"><span class="mg-icon">' + s.icon + '</span><span class="mg-label">' + escapeHtml(s.label) + '</span></button>'
    ).join('');
    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">More</div>
      <div class="more-grid">${gridHtml}</div>
      <div class="modal-actions">
        <button class="cancel" id="moreBackup" style="flex:1">⤓ Backup data</button>
        <button class="cancel" id="moreClose" style="flex:1">Close</button>
      </div>
    `;
    overlay.classList.remove('hidden');
    content.querySelectorAll('.more-grid-item').forEach(btn => {
      btn.onclick = () => {
        closeModal();
        switchSection(btn.dataset.go);
      };
    });
    document.getElementById('moreBackup').onclick = exportBackup;
    document.getElementById('moreClose').onclick = closeModal;
  }

  function exportBackup(){
    const data = localStorage.getItem(STORAGE_KEY);
    if(!data) return;
    const blob = new Blob([JSON.stringify({ [STORAGE_KEY]: data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = 'the-standard-backup-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  const PRIMARY_SECTIONS = ['dashboard', 'calendar', 'tasks', 'habits'];

  function setTrackTransform(section, animate){
    const track = document.getElementById('tabTrack');
    const idx = PRIMARY_SECTIONS.indexOf(section);
    if(idx === -1) return;
    if(!animate){
      track.classList.add('no-anim');
      track.style.transform = 'translateX(-' + (idx * 25) + '%)';
      void track.offsetHeight;
      track.classList.remove('no-anim');
    } else {
      track.style.transform = 'translateX(-' + (idx * 25) + '%)';
    }
  }

  function switchSection(section, opts){
    opts = opts || {};
    currentSection = section;
    const isPrimary = PRIMARY_SECTIONS.indexOf(section) !== -1;
    document.getElementById('tabViewport').style.display = isPrimary ? 'block' : 'none';
    document.getElementById('listsSection').style.display = section === 'lists' ? 'block' : 'none';
    document.getElementById('longGoalsSection').style.display = section === 'longgoals' ? 'block' : 'none';
    document.getElementById('fitnessSection').style.display = section === 'fitness' ? 'block' : 'none';
    document.getElementById('budgetSection').style.display = section === 'budget' ? 'block' : 'none';
    document.getElementById('projectsSection').style.display = section === 'projects' ? 'block' : 'none';
    document.getElementById('journalSection').style.display = section === 'journal' ? 'block' : 'none';
    if(isPrimary) setTrackTransform(section, !opts.skipAnim);
    document.getElementById('fabBtn').style.display = (section === 'dashboard' || section === 'journal') ? 'none' : 'flex';
    document.querySelectorAll('.bottom-nav-btn[data-section]').forEach(b => b.classList.toggle('active', b.dataset.section === section));
    const isOverflow = OVERFLOW_SECTIONS.some(s => s.id === section);
    document.getElementById('moreNavBtn').classList.toggle('active', isOverflow);
    if(section === 'dashboard') renderDashboardSection();
    if(section === 'calendar') requestAnimationFrame(updateNowLine);
  }

  function switchView(v){
    view = v;
    document.getElementById('todayView').style.display = v === 'today' ? 'block' : 'none';
    document.getElementById('blockView').style.display = v === 'block' ? 'block' : 'none';
    document.getElementById('listView').style.display = v === 'list' ? 'block' : 'none';
    document.getElementById('btnToday').classList.toggle('active', v === 'today');
    document.getElementById('btnBlock').classList.toggle('active', v === 'block');
    document.getElementById('btnList').classList.toggle('active', v === 'list');
    requestAnimationFrame(updateNowLine);
  }

  function renderAll(){
    document.getElementById('weekLabel').textContent = weekLabel();
    renderTabs();
    renderLegend();
    renderAllDayBanners();
    renderFixedBanners();
    renderTaskSection();
    renderBlockView();
    renderListView();
    renderTodayView();
    renderHabitsSection();
    renderListsSection();
    renderLongGoalsSection();
    renderFitnessSection();
    renderBudgetSection();
    renderProjectsSection();
    renderJournalSection();
    if(currentSection === 'dashboard') renderDashboardSection();
  }

  document.getElementById('weekLabel').textContent = weekLabel();
  document.getElementById('prevWeek').onclick = () => {
    weekAnchor.setDate(weekAnchor.getDate() - 7);
    renderAll();
  };
  document.getElementById('nextWeek').onclick = () => {
    weekAnchor.setDate(weekAnchor.getDate() + 7);
    renderAll();
  };
  document.getElementById('calendarBtn').onclick = openCalendarModal;
  document.getElementById('reviewBtn').onclick = openWeeklyReviewModal;
  document.getElementById('btnToday').onclick = () => switchView('today');
  document.getElementById('btnBlock').onclick = () => switchView('block');
  document.getElementById('btnList').onclick = () => switchView('list');

  document.querySelectorAll('.bottom-nav-btn[data-section]').forEach(btn => {
    btn.onclick = () => switchSection(btn.dataset.section);
  });
  document.getElementById('moreNavBtn').onclick = openMoreSheet;
  document.getElementById('fabBtn').onclick = () => {
    if(currentSection === 'calendar') openAddEventModal(null);
    else if(currentSection === 'tasks') openAddTaskModal(null);
    else if(currentSection === 'lists') openAddListModal();
    else if(currentSection === 'habits') openAddHabitModal();
    else if(currentSection === 'longgoals') openAddLongGoalModal();
    else if(currentSection === 'fitness') openAddExerciseModal();
    else if(currentSection === 'budget') openAddTransactionModal();
    else if(currentSection === 'projects') openAddProjectModal();
  };

  (function setupSwipeNav(){
    const track = document.getElementById('tabTrack');
    const viewport = document.getElementById('tabViewport');
    const EDGE_EXCLUDE_SELECTOR = '.day-tabs, .legend, .fit-day-tabs, .cat-picker';
    let startX = 0, startY = 0, dragging = false, locked = false, baseIdx = 0;

    function isBlocked(target){
      if(target.closest && target.closest(EDGE_EXCLUDE_SELECTOR)) return true;
      const overlay = document.getElementById('modalOverlay');
      if(overlay && !overlay.classList.contains('hidden')) return true;
      const catMenu = document.getElementById('catMenu');
      if(catMenu && !catMenu.classList.contains('hidden')) return true;
      return false;
    }

    viewport.addEventListener('touchstart', (e) => {
      if(PRIMARY_SECTIONS.indexOf(currentSection) === -1) return;
      if(e.touches.length !== 1) return;
      if(isBlocked(e.target)) return;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      dragging = true; locked = false;
      baseIdx = PRIMARY_SECTIONS.indexOf(currentSection);
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if(!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if(!locked){
        if(Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if(Math.abs(dy) > Math.abs(dx)){ dragging = false; return; }
        locked = true;
        track.classList.add('no-anim');
      }
      e.preventDefault();
      const pct = (dx / window.innerWidth) * 25;
      let target = -(baseIdx * 25) + pct;
      const min = -((PRIMARY_SECTIONS.length - 1) * 25);
      const max = 0;
      if(target > max) target = max + (target - max) * 0.35;
      if(target < min) target = min + (target - min) * 0.35;
      track.style.transform = 'translateX(' + target + '%)';
    }, { passive: false });

    function endDrag(e){
      if(!dragging) return;
      dragging = false;
      if(!locked) return;
      track.classList.remove('no-anim');
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      const dx = t ? (t.clientX - startX) : 0;
      const threshold = window.innerWidth * 0.18;
      const atLastTab = baseIdx === PRIMARY_SECTIONS.length - 1;
      let newIdx = baseIdx;
      if(dx <= -threshold && !atLastTab) newIdx = baseIdx + 1;
      else if(dx >= threshold && baseIdx > 0) newIdx = baseIdx - 1;
      switchSection(PRIMARY_SECTIONS[newIdx]);
      if(dx <= -threshold && atLastTab) openMoreSheet();
    }

    viewport.addEventListener('touchend', endDrag, { passive: true });
    viewport.addEventListener('touchcancel', endDrag, { passive: true });
  })();

  switchSection('dashboard', { skipAnim: true });
  switchView('block');
  renderAll();
  setInterval(updateNowLine, 60000);
})();
