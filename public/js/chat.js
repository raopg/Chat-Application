const socket = io()

// Elements

const $messageForm =  document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton =  $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate =  document.querySelector("#sidebar-template").innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () =>{
    // New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height

    const visibleHeight = $messages.offsetHeight

    //Height of messages container

    const containerHeight = $messages.scrollHeight

    //How far have I scrolled?

    const scrollOffset = $messages.scrollTop + visibleHeight

    if((containerHeight - newMessageHeight) <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message) => {
    console.log("[SERVER]:" + message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()

})

socket.on('locationMessage', (location) =>{
    console.log("[SERVER]:" + location)
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        locationURL: location.text,
        createdAt: moment(location.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

socket.on('roomData', ({room, users}) =>{
    console.log(room)
    console.log(users)
})



$messageForm.addEventListener('submit', (event) =>{
    event.preventDefault()
    //Disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = event.target.elements.message.value
    socket.emit('sendMessage', message, (error) =>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        //Re-enable form
        if(error){
            console.log("Message was not received: " , error)
        }
        else{
            console.log("Message was received!")
        }
    })
})


$sendLocationButton.addEventListener('click', (event) =>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) =>{
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () =>{
            $sendLocationButton.removeAttribute('disabled')
            console.log("Location was received")
        })
    })
})

socket.emit('join', {
    username,
    room
}, (error) =>{
    if(error) {
        alert(error)
        location.href = "/"
    }
})
