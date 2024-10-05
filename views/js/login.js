let email = document.getElementById('email')
let password = document.getElementById('password')
let loginBtn = document.getElementById('loginBtn')

const ID = localStorage.getItem('id')

if(ID != null){
    window.location.href = '/home'
}

loginBtn.addEventListener('click', ()=>{
    fetch('/auth', {
        headers:{
            'Content-type':'application/json'
        },
        body:JSON.stringify({
            email:email.value,
            password:password.value
        }),
        method:'POST'
    }).then((res)=>{
        if(res.ok){
            return res.json()
        }else{
            throw new Error('Erro na requisição: ' + res.statusText);
        }
    }).then((data)=>{
        alert(data.msg)
        if(data.id != null){
            localStorage.setItem('id', data.id)
            localStorage.setItem('nome', data.nome)
            console.log(data.id)
            window.location.reload()
        }
    })
})