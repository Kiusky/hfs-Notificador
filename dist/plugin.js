exports.repo = "Kiusky/hfs-Notificador-BR"
exports.version = 0.5
exports.description = "Receba notificações do HFS"
exports.apiRequired = 12.3
exports.preview = ["https://github.com/user-attachments/assets/03a79254-7aa9-451c-a76b-9fef93b2e3b8", "https://github.com/user-attachments/assets/a84ccd7d-1179-4f5f-8217-8edf327d123e", "https://github.com/user-attachments/assets/9106806d-db40-4c95-b636-f86b4c73c13b"]

exports.config = {
    uploads: { 
        type: 'boolean', 
        defaultValue: true, 
        label: "Notificar uploads" 
    },
	newIp: { 
    type: 'select', 
    options: { 
        "Nunca notificar": false, 
        "A cada 30 minutos": 0.5,
        "A cada 1 hora": 1
    }, 
    defaultValue: false, 
    label: "Notificar conexão por IP" 
	},

    logins: { 
        type: 'boolean', 
        defaultValue: true, 
        label: "Notificar login" 
    },
}

exports.init = api => {
    const { exec } = api.require('child_process')
    const { cmdEscape, bashEscape } = api.require('./util-os')
    const { platform } = process
    const exe = api.require('path').join(__dirname, 'Notificação.exe')
    const seen = new Set()

    api.events.on('uploadFinished', ({ ctx }) => {
        if (api.getConfig('uploads'))
            notify(`Uploaded: ${ctx.state.uploadDestinationPath}`)
        if (api.getConfig('uploadUser') && ctx.user)
            notify(`User "${ctx.user}" uploaded a file`)
    })

    api.events.on('newSocket', ({ ip }) => {
        if (ip === '::1') ip = 'Localhost'

        const hours = api.getConfig('newIp')
        if (!hours || seen.has(ip)) return
        seen.add(ip)
        api.setTimeout(() => seen.delete(ip), hours * 3600_000)
        notify(`Nova conexão de ${ip}`)
    })

	api.events.on('login', ({ username }) => {
		if (api.getConfig('logins'))
        notify(`Usuario "${username}" esta logado !`)
})


    return {
        customApi: { notify }
    }

    function notify(message, title='Servidor HFS') {
        api.log(message)
        const cmd = platform === 'win32'
            ? `${cmdEscape(exe)} ${cmdEscape(title)} ${cmdEscape(message)}`
            : platform === 'darwin'
                ? `osascript -e 'display notification ${cmdEscape(message)} with title ${cmdEscape(title)}'`
                : `notify-send ${bashEscape(title)} ${bashEscape(message)}`
        exec(cmd, (err, stdout, stderr) => {
            if (err || stderr)
                return api.log(String(err || stderr))
        })
    }
}
