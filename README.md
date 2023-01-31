# ventbot
## experience
- admin types /ventbot
- bot sends message with button, pins it
- on button click, opens modal with unique link button
- link goes to channel with ?add=
  - redirect to remove search param

- user opens vent.tombl.dev
- presented with a list of channels

- user has the channel open
- last ~10 messages load, and they update in realtime
- users can send messages
  - postprocessed for emoji/mentions/channels
  - maybe overlay preview on blur
- users can edit messages that they sent
  - likewise delete

- other users can right click vented messages in discord to get an id
  - base32 hash of user channel auth + name

## required features
- authorisations table
  - authorisation id = ulid
  - expiry
  - discord user id
  - discord channel id
  - actions:
    - [x] create for user in channel
    - [x] delete expired/unclaimed
    - [x] claim
    - [x] get channel info
    - [x] subscribe to channel messages
    - [x] create hash from name

- authorisation/useragent table
  - actions:
    - [x] add and validate
      - if incompatible, log discord id, user agents, and revoke authorisation
      - compatibility = mobile/desktop, browser

- webhooks table
  - discord channel id
  - webhook url
  - actions:
    - [x] create for channel
    - [x] send message
      - recreates webhook if deleted

- sent messages table
  - authorisation id = user
  - sent as name
  - discord message id
  - hash = `hash(authorisation id + name)` generated
  - actions:
    - [x] create from authorisation
    - [x] edit with authorisation
    - [x] get hash by message id
    - [x] admin: get sender username by hash/message id