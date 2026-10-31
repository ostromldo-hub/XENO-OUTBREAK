# XENO — Room First (0.36.1)

## Start
Stop the old server with Ctrl+C. Extract ALL files. Open XENO and run START_XENO_WINDOWS.cmd. Open http://localhost:3000 and press Ctrl+F5. Node.js 20 or newer is required.

## Multiplayer — up to six players
1. Only the host starts the server. Keep its terminal open.
2. Host opens http://localhost:3000, enters a callsign and creates a squad.
3. In the game, choose INVITE FRIENDS beside the room code.
4. For friends on the same Wi-Fi or LAN, copy the displayed network invite link. Friends open it on their computer, enter a callsign and select JOIN ROOM. The link fills in the code. They do not install or start another server.
5. Allow Node.js on your private network if Windows Firewall asks. Avoid guest Wi-Fi that isolates devices. If several network addresses appear, choose the one belonging to your Wi-Fi/Ethernet adapter. The terminal also prints detected LAN addresses.

Room codes belong to the running host server. A room code alone cannot connect separate servers. Closing the host terminal ends the session. Maximum six players includes the host.

### Internet play from different houses
LAN addresses and localhost are not public internet addresses. This download does not create public hosting. To play across the internet, run the included Node.js server on a public Node host supporting persistent processes and WebSockets, or use an HTTPS tunnel to the host's port 3000. Friends must open that same public URL. Do not use static-only hosting.

Public host configuration: install with npm install, start with npm start, Node.js 20 or newer. The server listens on 0.0.0.0 and reads the PORT environment variable (default 3000). Optional PUBLIC_URL=https://your-game-address configures the public invite URL. Use one server instance because rooms are stored in memory; do not scale to independent replicas. Keep the server online throughout the expedition. /health is the health-check path. No public server is deployed by this ZIP.

## Opening and ending scenes
First enter your callsign and create or join a room. Only after the server confirms you have joined does the three-part animated briefing open. An invalid room code stays on the join screen. Continue through each part, or choose SKIP BRIEFING / Escape to deploy immediately. It explains the four guardians, component pickups, relays, base defense and squad extraction, plus basic controls and the optional Battle Beacon.
Winning The Last Signal mission opens a rescue outro with squad score, your kills and completed beacon rounds. RETURN TO SQUAD closes it. The host can then choose START A NEW EXPEDITION. Repeatable beacon rounds award their usual rewards; the full rescue outro is reserved for completing the main mission. Scenes use lightweight CSS animation and support reduced-motion settings.

## Performance changes in this version
Default Performance mode now renders at a maximum 0.65 pixel ratio instead of 0.85 (about 42 percent fewer rendered pixels at those caps), with 800 grass blades instead of 1,800, and up to 240 rain particles instead of 500. View distance is 520 m. Anti-aliasing is disabled. Distant instanced forest patches are hidden before submission. Rendering stops in hidden tabs.
Full game snapshots arrive at 10 Hz instead of 20 Hz, reducing network payload frequency and HUD rebuilds; authoritative movement and combat simulation remain at 20 Hz. Client camera and alien positions still interpolate. F2 selects Balanced or High if you prefer more detail. Any previously selected quality mode remains saved. Actual laptop FPS has not been measured.

## Smaller world, same regions
The playable arena is now 640 by 640 metres: 44 percent less area than the previous 960 m map. All four outer regions, seven lookout towers, twelve regional objectives and The Last Signal mission remain, with shorter trips between them.

Northwest: Frostreach Highlands, snow-colored ridges and Frost Howlers.
Northeast: Crimson Dunes, sandy hills and fast Dune Razors.
Southeast: Mirefall Wetlands, shallow pools and ranged Mire Spitters.
Southwest: Cinder Basin, dark rocky terrain and hard-hitting Cinder Brutes.

Vegetation in the outer regions is reduced further. The central rainforest and imported forest remain. Four regional nest guards and six central hunt contacts remain, with additional attackers arriving during Battle Beacon rounds. Only three beacon attackers can be active at once, with a total alien cap of fourteen.

## Battle Beacon: repeatable action
Follow the Battle Beacon direction on the HUD near the starting base. Press E within 4.5 m to begin. Winning rotates through three challenges:
- Hunt: kill six attackers in 75 seconds. Later wins raise the goal, up to ten.
- Targets: shoot fifteen hovering drones in 45 seconds.
- Hold: defend the area within 16 m of the beacon for 25 seconds, within a 60-second limit.

Eight one-shot hovering practice targets surround the beacon and respawn after three seconds. Each gives 25 score; every four hits gives one weapon XP. They remain available between rounds. Winning a challenge gives the squad 300 score, four weapon XP, ammo and up to 25 health and suit energy. Starting a challenge refills ammo. Press E again after the short cooldown for the next round. Hold and hunt rounds bring in mixed alien attackers while a player is near the beacon.

## Objectives
J opens The Last Signal journal. Hunt its four named guardians, recover components with E, restore relays, broadcast and extract.
O opens twelve optional regional objectives and lookout directions:
- Surveys: E at the uplink, then stay within 16 m for 15 seconds. Progress pauses when the squad leaves.
- Nests: kill the nest guardian, E to arm the charge, then hold within 16 m for 8 seconds.
- Salvage: E to recover a flight recorder, then E at any safe-house center or base terminal to deliver it.
Each completion gives the connected squad 300 score, 3 weapon XP, health and suit energy. Progress is shared.

Regional camp centers are now (-215,-250), (215,-250), (215,250), (-215,250). Five central shelters remain, making nine safe houses. North is negative Z.

## Seven lookout towers
The three central timber towers remain at (-180,140), (170,-150), (-165,-165). One of those three randomly holds the sniper rifle.
New regional lookouts are at (-270,-305), (270,-305), (270,305), (-270,305). They stand 30–38 m above their local ground. E grabs the straight ladder, W/S climbs up/down, Space lets go. At the top you automatically step onto the platform.

## Controls and weapons
WASD move; Shift run; Space jump; mouse look; left mouse fire; right mouse scope; T thermal/optical; V toggle scope; R reload/respawn; E interact; J main journal; O regional objectives; F flashlight; M mute; Escape release mouse.
1 rifle, 2 SMG, 3 DMR, 4 pulse rifle, 5 sniper. Collect floating weapons above glowing rings with E. Kills and regional rewards improve magazine capacity, fire rate and reload time. Aliens still die from two body hits or one headshot.

Daylight lasts 20 minutes, followed by 3 minutes total of dusk, night and dawn. Footsteps use gentle grass squishes and light wood taps.

## Performance
PERFORMANCE mode is the default, with real-time shadows disabled, 800 nearby grass blades, reduced rain, lower render resolution and a shorter scenic view distance. F2 cycles Performance / Balanced / High and shows FPS. Static vegetation is split into cullable patches and grass updates are spread across frames.

All 112 automated gameplay checks and ZIP extraction pass. Actual FPS and appearance have not been measured on your laptop. If it still lags, report the FPS and whether pauses occur while walking, shooting or standing still. Room progress is held in memory and resets when the expedition/server restarts.
