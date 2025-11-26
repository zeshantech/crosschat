create a cross platform chat app that will connect whatsapp, messenger, instagram, slack, telegram, discord, line, wechat, twitter, linkedin, skype, viber, signal, emails and more. The app should have the following features

- exact same UI as whatsapp web (smoothness, colors, layout, etc)
- Unified inbox to view messages from all connected platforms
- Real-time notifications for incoming messages
- settings options for customizing notifications, themes, privacy
- notification tab to manage and view all notifications
- inbox tab to view and manage all messages (read, unread, archived)
- AI assistant to help with message drafting, scheduling, and quick replies
- tags tab to organize conversations with custom tags (create tags, assign tags to conversations, filter by tags)
- automatic sync for customers (if 1 member is from a different platform, sync messages from that platform)
- AI customization options (customize AI behavior, tone, response style)

in inbox:
- Search functionality to find messages
- for messages: delete, resend, reply, forward, add to favorites, select, message info, close chat
- for chat: lock chat, mute notifications, pin, mark as unread/read, export chat, clear chat, delete chat options
- if 1 customer from a different platforms - show platform icon next to their name
- on permission - a member can assign conversations to other members (assign to AI agent as well)
- message reactions (like, love, laugh, etc)
- media preview (images, videos, documents) within the chat (support all types for medias as in whatsapp)

connect tab:
- option to connect/disconnect different messaging platforms
- manage connected accounts
- view connection status for each platform

members tab:
- create and manage team members
- assign roles and permissions
- view member activity logs
- invite new members via email or link

analytics tab:
- view message statistics (total messages, response times, etc)
- platform-specific analytics (messages per platform, user engagement, etc)
- export analytics reports
- AI-generated insights and recommendations for improving communication strategies
- customizable date ranges for analytics
- visual graphs and charts for better data representation
- track team member performance (response times, message handling, etc)
- monitor customer satisfaction through feedback and ratings


for Technology stack:
- Nextjs + supabase + shadcn/ui (check components in /components/ui) + tanstack query + react hook form + yup + dayjs + zustand + lazy loadings + make as much smooth as whatsapp web as possible
- for pricing payments use stripe, payfast, paypal
- for AI use openai api
- for real-time use supabase real-time
- for Auth use phone number as whatsapp does
- for minimal backend use nestjs with supabase as main database
- multi tenant architecture with separate database (shared will be for pricing plans and these kind of shared things)



prompt 2:
- use shadcn components instead customized components, check shadcn components in /src/components/ui directory (dont change in that components/ui directory, use them as it is) - even buttons, inputs, modals, sidebar, selectors, toast and all other components
- where is authentication flow as I explained using phone number?
- make things as simple as in whatsapp web (UI similarity, smoothness, etc)
- simple design not too much tailwind code
- settings option as in wharsapp web (i said make all things as in whatsapp web)
- UI not responsive as well for now
- when open chat its inbox also exact same as whatsapp web
- means when user use it should feel like using whatsapp web but with more features

again UI exact replica copy of whatsapp web



prompt 3:
- make sure all tabs (inbox, notifications, connect, members, tags, analytics, settings) are there in sidebar as in whatsapp web sidebar and open corresponding tab content when clicked intsead of sidebar
- in inbox tab show all chats on left side and when click on chat show chat conversation on
- use icons instead names on tabs (like whatsapp icon, intsagram icon)
- plz dont use custome colors (use like muted, muted-foreground, border, secondary, secondary-foreground, accent, accent-foreground, etc as in shadcn/ui)
- dont use custome fonts, and sizes use as in shadcn/ui (like xs, sm, md, lg, xl, 2xl etc)
- avoid to use too much divs and spans use just for necessary places
- on right click of chat show context menu with options like delete chat, archive chat, mark as read/unread, pin chat, mute notifications, export chat, clear chat etc (same in chat header as well)
- on right click of message show context menu with options like delete message, reply, forward, add to favorites, message info etc
- use shadcn/ui context menu component for context-menu
- on click on profile show details in a side panel (like whatsapp web)
- message send input should be exact same as whatsapp web (with emoji picker, attachment options, send button etc)
- instead of message type use like in single message I can send message +  documents together (like whatsapp web)

again UI exact replica copy of whatsapp web



Prompt 4:
- every tab should have sidebar as Inbox have and right side area will be showing illustration if no option is selected like in inbox tab
- profile and settings should be in only in sidebar not in right side area
- check images for reference

again UI exact replica copy of whatsapp web



Prompt 5:
- in Inbox there should not be default select chat and show illustration on right side until user select a chat
- in notification, connection, tags, settings, profile there should be illustration on right side always and manage these things in just left side area
- Tags: context menu in tags and user can change name on click on name as well
- Members: context menu in members as well and actions like remove member, change role etc - also when click on add open dialog to add new member
- Notifications: context menu in notifications as well - actions like mark as unread/read, delete notification etc
- connection: context menu in connections as well actions like disconnect, manage account etc - and user can simply connect and disconnect channel from button as well (also user can connect multiple accounts of same platform) - like show first channel connect options like whatsapp, insts and all icon buttons and then show connection cards below (redesign this section from scratch)

again UI exact replica copy of whatsapp web for each part



Prompt 6:
- on click on each settings option show further options or customization UI for that option in a side panel (like whatsapp web)
- in profile as well show details in side panel (like whatsapp web)
- add 1 more option to create roles and assign permissions to roles and then assign roles to members (like admin, agent, etc)

again UI exact replica copy of whatsapp web for each part



Prompt 7:
- in settings we have (Account, Privacty, Chats, Notifications, Linked Devices, Help) - You have know better then me which options should be there in each settings option (show in Left panel not in right sidebar)
- in Profile we have (Profile, Security, Appearance) - You Have know better then me which options should be there in each profile option (show in Left panel not in right sidebar)
- in roles context menu options should be (edit name, delete roles, duplicate role) - and when click on role and showing in right panel (show delete, duplicate role options there as well - on top right side)
- In member context menu roles should be dynamic and show all roles created in roles tab as sub menu - and click on add member roles should be dynamic as well showing all roles created in roles tab (use select component from shadcn/ui for roles selection instead triditional select dropdown)

again UI/UX should be same experience as whatsapp web for each part



Prompt 8:
- in settings we have (Account, Privacty, Chats, Notifications, Linked Devices, Help) - You have know better then me which options should be there in each settings option (show in Left panel not in right sidebar)
- in Profile we have (Profile, Security, Appearance) - You Have know better then me which options should be there in each profile option (show in Left panel not in right sidebar)
- roleLabels is not defined in member (getting ERROR)

again UI/UX should be same experience as whatsapp web for each part



Prompt 9 (enhancements in Inbox tab):
- user can select multiple chats from left side chat list (using checkbox on hover on chat) and then perform bulk actions like delete chats, archive chats, mark as read/unread, mute notifications, pin chats etc
- show (All, Unread, Favorites, spam) by badge bottom of left side panel under search bar and filter chats accordingly when clicked
- add a menu button next to search bar and click on that show 2 more options below to that search bar (1. platform filter 2. tag filter)
- Archived chats section in left side panel top of all chats (clicking on it will show archived chats in left side panel exact as in whatsapp web)
- mark chat as favorite and spam options in chat context and chat header menu
- In chat context make mark as Read and Unread show 1 option based on chat status (if chat is read show mark as unread and vice versa)
- both context menu and chat header have same options

again UI/UX should be same experience as whatsapp web for each part



Prompt 10 (enhancements in Inbox tab):
- when clicking on archived chats and hide archive option that is on top
- if no chat is selected dont show checkbox in left side of the chat (only show checkbox if that chat is selected and dont show exact in left side show by absolute position)
- next of search you added a filter icon and clicking on that you are showing 2 selectors (that is looking too ugly) - instead show chips for platform filter and for tags you can show selector (but keep it small and cover in minimal area)
- hasUnread is not defined when click on chat (getting ERROR)
- when opened archived hide search bar, tags and filters (like in whatsapp web) - and should have back button to go back to main chat list with Header show Archived (as in whatsapp web)
- if no archived chats dont show archived section in left side panel
- spam filter not working (showing all chats)

again UI/UX should be same experience as whatsapp web for each part



Prompt 11 (enhancements in Inbox tab):
- when select chats there should not show bulk actions on top instead when selected and open context menu (bulk content menu should be open)
- for more filters user should click on icon (next to searchbar and then show more options instead showing always)
- for channel filter check supported channels first in connect tab (you are showing too much channels)
- in chatItem show icon instead channel name in badge (so its looks more clean) same for spam as well
- in more filters tags use popover and command (both are in components/ui) instead triditional select and use icon for open that popover so both (channel and tags) filters in 1 line


Propmt 12 (enhancements in Chatbox):
- message should have much options as in whatsapp web (like reply, copy, react, download, forward, pin, star, report, delete, edit (under 15 minutes))
- proper attachments preview in message bubble (pdf, video, audio, image, document, contact, location, contact, pool, voice note, event, link, sticker and all other types)
- proper input attachments options and show selected attachments properly (if image show image editor and text input, if video show video editor and text input, audio show audio preview and text input) and all these kind of things as exact in whatsapp web
- I wanna provide experience as user using whatsapp web (smoothness, UI, UX, features and all)

again UI/UX should be same experience as whatsapp web for each part

Propmt 13 (enhancements in Chatbox):
- the size of showing attachments in message bubble is too large (it should be limited as in whatsapp web)
- please use your sense as you know in whatsapp user can attach 1 kind of attachments in 1 message (1 single message user can attach video and img together) and when selected attachment input part is on full screen not just attached with input (follow UI also of whatspp web)
- and when select number it should open modal
- where is emojis part?? and in emojies there should be stickers tab and gif tab as in whatsapp web
- in attachment there is no sticker option and for event there should be proper UI for poll there should be proper UI in both bubble and input when selecting
- you have missed many things and creating as you want not following whatsapp web

prompt 14 (enhancements in Chatbox):y
- in 1 message there will be 1 attachment (if user select multiple then send that much messages) - but attachment can be have message as well (like in whatsapp web)
- if there is attachment there will be no too much padding in bubble (like in whatsapp web) - to improve UI
- when open attachment select Menu its UI should have 1 Icon + text (like in whatsapp web)
- for emojis (whether on message react and Input use a proper Library for emojis) - as in whatsapp web
- If there is a 1 Emoji in message show that emoji little bit bigger without bubble (like in whatsapp web) - same if emojis 2 then little bit bigger but not too much with bubble - and same if 3 or 4

Prompt 15 (enhancements in Chatbox):
- bro for Multiple Attachments there should be multiple messages (if user have selected 5 images then send 5 messages but when nexttime user open that chat then show all attachments in 1 bubble as in whatsapp)
- for emojis use "@ferrucc-io/emoji-picker" for both message react and input
- Message input should be little larger as in whatsapp web
- if user have sent 1 emoji there will be no bubble but for 2 or more emojis there will be bubble as in whatsapp
- in chatbox header there will be call options (audio and video both - also call scheduling option)
- in input there should be 1 Voice Record option
- when attaching attachment (a editor opening that UI is not good - should be in Full Screen of chatbox and UI should be good as in Production level app like whatsapp)


Prompt 16 Strictly Follow instructions (enhancements in Chatbox):
- message, chat header, list menu should have icon with every option
- bro again if I select 5 images there should be 5 messages not 1 message (I have mentioned this thing many times)
- please check "@ferrucc-io/emoji-picker" library properly (its not showing any emoji instead little card showing)
- in message react option it should open emoji picker instead sub Menu (6, 7 emojis)
- when click on voice record option it should record voice and showing recording UI over input (like in whatsapp)
- plz again when user selected attachment instead opening dialog please show full screen editor (covering chatbox area as in whatsapp)
- why link option in attachments ??? (I was talking about link we automatically detect link in input and show link preview in message bubble as well as in input)


Prompt 17 Strictly Follow instructions (enhancements in Inbox and Chatbox):
- When user select any attachment it should upload that to S3 (and then send to user but show message Bubble immediately to sender - so there is showing 0 delay)
- Bro again you are attaching all attachments in 1 message (I message can only have 1 attachment that can be image, video or anything)
- If user send 5 images at a time it should send 5 messages
- when click to open emoji there should be 3 tabs (EMojis, Stickers, GIFs)
- In chatbox header when user opening menu each option should have icon with text - same for Inbox list
- when user click on React in message menu it should open emoji picker (for now not opening)
- when user click on Mic Icon its showing progress second by second (but it should actually record voice and show that progress base on volume)
- send that voice message as well
- if message have any attachment there should not too much padding (for now its showing too much on poll, event, location, contact, etc)
- when user click on create event or poll it should direct send instead showing in input
- remove contact share attachment option
- when click to send location it should open location picker and when user selected location and send it should send instead move to input
- 1 message can only have 1 attachment (please please please follow this instruction)

