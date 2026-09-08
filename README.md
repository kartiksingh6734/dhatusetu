# E-Waste Bridge

Build a mobile-first web application called "DhatuSetu".

DhatuSetu is a simple digital bridge between informal e-waste collectors (kabadiwalas) and authorized e-waste recyclers.

The first prototype must focus on ONE complete working journey:

Collector → Create Lot → Price Estimate → Find Recycler → Accept Quote → Handover → Payment → Khata.

TARGET USERS

- Informal e-waste collector

- Recycler

DESIGN

- Designed primarily for Android mobile screens.

- Extremely simple for users with limited literacy.

- Large touch targets and large icons.

- Minimal text.

- Clean, trustworthy, professional Clean & Green Technology appearance.

- Use an accessible high-contrast design.

- Support English initially, but structure the UI so Hindi and Marathi can be added later.

- Avoid unnecessary animations and heavy graphics.

CREATE THESE SCREENS:

1. Welcome / Language screen

2. Collector Home

3. Create Lot

4. Price Estimate

5. Recycler Offers

6. Lot Handover / Lot Passport

7. Payment Confirmation

8. Khata / Earnings

9. Transaction History

10. Safety Centre

COLLECTOR HOME:

Show four large actions:

- Create Lot

- Price Board

- Find Buyers

- My Khata

Also show:

- Current online/offline status

- Latest transaction

- Total earnings

CREATE LOT:

Allow the collector to:

- Select material category

- Add a material photograph

- Enter approximate weight

- Select condition

- Create a unique Lot ID

Initially support:

- PCB

- Cables

- Batteries

- Motors

- LCD panels

- CRTs

- Mixed plastics

PRICE ESTIMATE:

After creating a lot, show:

- Material

- Weight

- Estimated price range

- Estimated total value

- Current price information

- A clear disclaimer that the estimate is indicative and the final price is determined by the recycler.

RECYCLER OFFERS:

Show suitable recycler cards containing:

- Recycler name

- Verification/authorization status

- Distance

- Material accepted

- Offered rate

- Pickup availability

- Estimated total offer

Allow the collector to select and accept one offer.

LOT PASSPORT:

Display:

- Unique Lot ID

- Material

- Photograph

- Weight

- Quoted price

- Selected recycler

- Collection timestamp

- Handover status

PAYMENT:

After handover, allow recording:

- Final weight

- Final price

- Total amount

- Payment method: Cash or UPI

- Payment status: Paid or Pending

Do NOT integrate a real payment gateway yet.

KHATA:

Show:

- Total earnings

- Paid amount

- Pending amount

- Recent transactions

- Lot ID

- Material

- Amount

- Payment status

TRANSACTION HISTORY:

Show previous completed transactions.

SAFETY CENTRE:

Create simple pictorial safety cards for:

- Do not burn cables

- Do not use acid on PCBs

- Safe battery handling

- Safe CRT handling

- Do not manually dismantle hazardous components without protection

NAVIGATION:

Create working navigation between all screens.

IMPORTANT:

For this first generation, prioritize a clean, functional mobile UI and working navigation.

Do not implement AI/ML yet.

Do not implement real payment integration yet.

Do not implement complex offline synchronization yet.

Do not create an admin dashboard yet.

Do not create unnecessary pages or features.

Use realistic demo data where database functionality has not yet been connected.

Make the prototype visually polished enough for a student innovation competition demonstration.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dhatusetu.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8251c4a2-3c13-426d-be7c-5a4aaec00d89).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
