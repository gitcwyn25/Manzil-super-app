# Public hero photography

The main landing page, localized Discover hub, Reviews home and Reviews auth
page use locally hosted, native high-resolution photographs. Never upscale the
former 549px metro or 1024px café assets for these full-screen surfaces.

| Asset | Source dimensions | Author / licence | Source |
| --- | --- | --- | --- |
| `apps/web/public/discover/chorsu-bazaar-6k.jpg` | 5985 × 3990 | Adam Harangozó / CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Chorsu_Bazaar_in_Tashkent.jpg |
| `apps/web/public/discover/tashkent-metro-4k.jpg` | 4472 × 2981 | Tim Adams / CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Mustaqillik_Maydoni_station_of_Chilanzar_Line_of_Tashkent_Metro_in_Tashkent_Uzbekistan.jpg |
| `apps/{web,reviews}/public/{discover,images}/neighbourhood-cafe-4k.jpg` | 3840 × 2560 | Matt Hoffman / Unsplash License | https://unsplash.com/photos/man-on-cash-register-photo-7zwyUZVrt-U |

Commons originals are copied without pixel edits. The café download uses
`https://images.unsplash.com/photo-1560463230-1d6803589edf?fm=jpg&q=92&w=3840&fit=max`;
`fit=max` prevents enlargement. Next Image supplies responsive image candidates
up to 3840px and smaller files to smaller screens. It compresses delivery images;
CSS crops the view and adds colour overlays without changing stored originals.
Hero images preload; app-card and auth illustrations load lazily.

Visible Photo credits links on each site lead to `/photography.html`, containing
author, source, licence and modification information. Responsive Chorsu photo
versions retain CC BY-SA 4.0. This is editorial imagery, not evidence about a
specific local business; listing photos remain the existing approved media.
