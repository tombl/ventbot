---
title: message verification
---

Every message sent through ventbot has a verification hash.
This hash is derived from a unique token stored on the venters device, as well as the name they're using.

This mechanism is designed for the sake of eliminating ventbot impersonation, because the hash of a message sent by an impersonator will be different to that of a message by the original venter.

For example, these factors will change the message's hash:
• Which device the message is sent from.
• Which browser it is sent from.
• Which channel it's sent to.
• What name the venter chooses.

These will keep the hash constant:
• Sending multiple messages with different contents.
• Sending messages on different days.

Therefore, if you don't want your venting today to link back to your previous venting, choose a different name, use a different device, or clear your cookies.