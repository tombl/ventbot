---
title: message verification
---

Every message sent through ventbot has a verification hash which ties it back to its author.
The hash accessible in Discord via *right click/long press on the message > Apps > verify*.

```rawhtml
<video controls muted src="https://media.discordapp.net/attachments/568675054485766166/1072156605434560552/2023-02-06_22-01-35.mp4"></video>
```
*a demonstration of message hashes. here, the top and bottom browser are different users, therefore their messages have different hashes. the impersonated user calls out the impersonator, prompting readers to check the authenticity of the messages.*

This hash is a value non-reversibly derived from:
• a unique token stored on the venters device.
• the name they're using.
• the current date.

This mechanism is designed for the sake of eliminating ventbot impersonation, because **the hash of a message sent by an impersonator will be different to that of a message by the original venter**.

For example, these factors will change the message's hash:
• which device the message is sent from.
• which browser it is sent from.
• which channel it's sent to.
• what name the venter chooses.
• what date it was sent on (rolls over at <t:0:t> in your timezone).

These will keep the hash constant:
• sending multiple messages with different contents.

Therefore, if you don't want one vent today to link back to a previous vent today, choose a different name, use a different device, or clear your cookies.

Additionally, if you suspect a vented message of being an impersonation, click *verify* to see its hash, and compare it with the hash of a known real message. If they differ, they were sent on different devices.
