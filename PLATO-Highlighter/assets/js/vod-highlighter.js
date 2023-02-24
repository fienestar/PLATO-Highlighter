$(() => {
    console.log("PLATO Highlighter enabled. ")

    function highlight_progress_bar(video, progress_bar)
    {
        video.ontimeupdate = function video$ontimeupdate() {
            console.log(video.currentTime)
            if (video.currentTime >= ((video.duration * 0.9 / 60) | 0) * 60){
                if(progress_bar.classList.contains('진행률-결석')){
                    progress_bar.classList.remove('진행률-결석')
                    progress_bar.classList.add('진행률-출석')
                }
            }else if(!progress_bar.classList.contains('진행률-결석')){
                progress_bar.classList.remove('진행률-출석')
                progress_bar.classList.add('진행률-결석')
            }
        }
    }

    const element_spin_lock = setInterval(()=>{
        let video = $('video')[0]
        let progress_bar = $('.vjs-coursemos-progress')[0]
        if(video && progress_bar){
            clearInterval(element_spin_lock)

            if(window.getComputedStyle(progress_bar)['background-color'].replace(/ /g,'') != 'rgb(0,91,170)') // 출석되지 않음
                highlight_progress_bar(video, progress_bar)
        }
    },100)
    
})