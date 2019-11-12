/**
 * @file 游密 WebRTC 演示代码
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2018/1/21
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

(function () {

    function E(id) {
        return document.getElementById(id);
    }

    // 检测浏览器支持
    if (!YMRTC.support) {
        alert('您的浏览器不支持RTC，请升级。');
        console.log('您的浏览器不支持RTC，请升级。');
        E('login-form').style.display = 'none';
        return;
    }

    let userTemplate = E('user-template').innerHTML;

    // 快捷填写测试账号
    const testUsers = {
        sanji: '10001',
        fantasy: '10001',
        '9999': '10001',
        zoro3000: '10002',
        youme_test201701: '201701',
        youme_test201702: '10002'
    };
    E('login-sanji').onclick
        = E('login-fantasy').onclick
        = E('login-9999').onclick
        = E('login-zoro3000').onclick
        = E('login-youme_test201701').onclick
        = E('login-youme_test201702').onclick
        = function (e) {
        let userId = e.target.value;
        let token = testUsers[userId];
        E('login-user-id').value = userId;
        E('login-user-token').value = token;
    };

    // 初始化
    let ymrtc = new YMRTC({
        appKey: 'YOUMEBC2B3171A7A165DC10918A7B50A4B939F2A187D0',
        video: true  // true - 视频+音频，false - 仅语音
    });

    // 登录并加入房间
    E('login').onclick = function () {
        let userId = E('login-user-id').value;
        let token = E('login-user-token').value;
        let roomId = E('login-room-id').value;

        if (!userId) {
            alert('请输入用户ID。');
            return;
        }
        if (!token) {
            alert('请输入token。');
            return;
        }
        if (!roomId) {
            alert('请输入房间号。');
            return;
        }

        // 登录
        ymrtc.login(userId, token).catch(() => {
            alert('登录失败。');
        });
        // 加入房间，会自动等待登录成功再加入房间
        ymrtc.joinRoom(roomId);
        // 初始化本地媒体，然后把本地媒体放入 <video>
        ymrtc.startLocalMedia().then((stream) => {
            E('local-media').style.display = 'block';
            E('local-media').srcObject = stream;
        }).catch((err) => {
            if (err.name === 'NotAllowedError') {
                alert('浏览器禁用了摄像头和麦克风的访问权限，或者页面没有使用 https 协议，请检查设置。');
            } else if (err.name === 'NotFoundError') {
                alert('没有找到摄像头或麦克风，请检查它们的连接。');
            } else {
                alert(err.name);
            }
        });
    };

    // 登出
    E('logout').onclick = function () {
        ymrtc.logout();
        ymrtc.stopLocalMedia();
        E('local-media').style.display = 'none';
    };

    // 屏蔽摄像头和麦克风（黑屏、静音）
    E('local-media-pause-video').onclick = function (e) {
        if (ymrtc.isLocalVideoPaused()) {
            ymrtc.resumeLocalVideo();
            e.target.innerHTML = '屏蔽摄像头';
        } else {
            ymrtc.pauseLocalVideo();
            e.target.innerHTML = '开启摄像头';
        }
    };
    E('local-media-pause-audio').onclick = function (e) {
        if (ymrtc.isLocalAudioPaused()) {
            ymrtc.resumeLocalAudio();
            e.target.innerHTML = '关闭麦克风';
        } else {
            ymrtc.pauseLocalAudio();
            e.target.innerHTML = '开启麦克风';
        }
    };

    // 退出或重新加入房间
    E('join-leave-room').onclick = function () {
        let roomId = E('room-id-input').value;
        if (!roomId) {
            alert('请输入房间号。');
            return;
        }
        if (ymrtc.inRoom(roomId)) {
            ymrtc.leaveRoom(roomId);
        } else {
            ymrtc.joinRoom(roomId);
        }
    };
    
    // 全部静音
    E('mute-all').onclick = function () {
        for (let i of document.querySelectorAll('.user-mute-on')) {
            i.click();
        }
    };
    
    // 取消全部静音
    E('cancel-mute-all').onclick = function () {
        for (let i of document.querySelectorAll('.user-mute-off')) {
            i.click();
        }
    };

    // 事件监听：登录、登出
    ymrtc.on('account.logged', function () {
        // 已登录
        E('not-log').style.display = 'none';
        E('logged').style.display = 'inline';
        E('login-form').style.display = 'none';
        E('rooms-container').style.display = 'block';
        E('user-id').innerHTML = ymrtc.getMyUserId();
    });
    ymrtc.on('account.logout', function () {
        // 已登出（并断开了各种连接）
        E('not-log').style.display = 'inline';
        E('logged').style.display = 'none';
        E('login-form').style.display = 'block';
        E('rooms-container').style.display = 'none';
        E('room').innerHTML = '';
        E('login').removeAttribute('disabled');
        E('login').innerHTML = '登录';
    });
    ymrtc.on('account.logging', function () {
        // 正在登录中
        E('login').setAttribute('disabled', true);
        E('login').innerHTML = '正在登录...';
    });

    // 事件监听：信令状态
    ymrtc.on('signaling.status:*', function (eventFullName, status) {
        E('signaling-status').innerHTML = status;
    });

    // 事件监听：本地媒体状态
    ymrtc.on('local-media.status:*', function (eventFullName, status) {
        E('local-media-status').innerHTML = status;
    });

    // 事件监听：加入、退出房间
    ymrtc.on('room.join:*', function (eventFullName, roomId) {
        // 自己加入了房间
        E('room-id').innerHTML = roomId;
        E('room-id').style.display = 'inline';
        E('room-id-input').value = roomId;
        E('room-id-input').style.display = 'none';
        E('join-leave-room').innerHTML = '退出房间';
    });
    ymrtc.on('room.leave:*', function (eventFullName, roomId) {
        // 自己退出了房间
        E('room').innerHTML = '';
        E('room-id').style.display = 'none';
        E('room-id-input').style.display = 'inline-block';
        E('join-leave-room').innerHTML = '加入房间';
    });

    // 事件监听：用户进入、退出房间
    ymrtc.on('room.member-join:*', function (eventFullName, roomId, memberId) {
        // 有人加入了房间
        let memberDom = E('user-container-' + memberId);
        if (!memberDom) {
            memberDom = document.createElement('div');
            memberDom.id = 'user-container-' + memberId;
            memberDom.className = 'user-container';
            memberDom.innerHTML = userTemplate.replace(/{{userId}}/g, memberId);
            E('room').appendChild(memberDom);

            // 把 stream 放入 <video>
            ymrtc.requestUserStream(memberId).then(function(stream) {
                E('user-video-' + memberId).srcObject = stream;
            });
            ymrtc.on('user.update-stream:' + memberId, function (mId, stream) {
                E('user-video-' + memberId).srcObject = stream;
            });

            E('user-mute-on-' + memberId).onclick = function () {
                ymrtc.setMute(memberId, true);
            };
            E('user-mute-off-' + memberId).onclick = function () {
                ymrtc.setMute(memberId, false);
            };
            
            if (ymrtc.getMute(memberId)) {
                E('user-mute-on-' + memberId).checked = true;
            } else {
                E('user-mute-off-' + memberId).checked = true;
            }
        }
    });
    ymrtc.on('room.member-leave:*', function (eventFullName, roomId, memberId) {
        // 有人退出了房间
        let memberDom = E('user-container-' + memberId);
        if (memberDom) {
            E('room').removeChild(memberDom);
        }
    });

    // 事件监听：用户状态
    ymrtc.on('user.ice-status:*', function (eventFullName, userId, status) {
        // ICE 状态
        let userDom = E('user-ice-status-' + userId);
        if (userDom) {
            userDom.innerHTML = status;
        }
    });
    ymrtc.on('user.signaling-status:*', function (eventFullName, userId, status) {
        // 信令握手状态
        let userDom = E('user-signaling-status-' + userId);
        if (userDom) {
            userDom.innerHTML = status;
        }
    });

    ymrtc.on('*', function (eventFullName) {
        console.log(eventFullName, arguments);
    });

})();
