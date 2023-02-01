# ventbot
## experience
- creation
  - admin types /ventbot
  - bot sends message with button, pins it
- on button click, opens sends ephemeral message with unique link button
  - link goes to /add/*
  - redirects to channel
- user opens https://vent.tombl.dev
  - presented with a list of channels
  - user has the channel open
  - last ~10 messages load, and they update in realtime
  - users can send messages
    - postprocessed for emoji/mentions/channels
    - swap for markdown preview on blur/focus
  - users can edit messages that they sent
    - ~~likewise delete~~: bad for 
- other users can right click vented messages in discord to get an id
  - base64 hash of user channel auth + name