(function () {
  console.log("PLATO Highlighter enabled. ")
  const current_url = window.location.href
  const domain = current_url.split('/').slice(0, 3).join('/')
  const course_view_url_start = `${domain}/course/view.php?id=`
  const check_view_state_url_start_a = `${domain}/report/ubcompletion/user_progress_a.php?id=`
  const check_view_state_url_start = `${domain}/report/ubcompletion/user_progress.php?id=`
  const course_id = +current_url.substr(course_view_url_start.length)
  let colors = {}
  let view = {}
  let settings = {}

  function normalize_title(title) {
    return title.replace(/ /g, '')
  }

  function get_child(element, index) {
    if (!Array.isArray(index))
      return get_child(element, [index])

    for (let i of index){
      if(i >= 0)
        element = element?.children?.[i]
      else
        while(i != 0){
          element = element?.parentElement;
          ++i;
        }
    }

    return element
  }

  // 녹강 하이라이트
  function highlight_videos() {
    if (!isFinite(course_id) || isNaN(course_id))
      throw Error('course_id is NaN')

    $.ajax({ url: check_view_state_url_start_a + course_id }).done(html => {
      let vdom = $.parseHTML(html)

      let video_state_list

      //if ($(vdom).find('.user_progress_table').length) {
        video_state_list = Array.from($(vdom).find('.user_progress_table')[0].children[2].children).map(e => ({
          title: normalize_title(e.children[+(e.children.length == 6)].textContent),
          presence: e.children[3 + (e.children.length == 6)].innerText
        })).filter(video => video.title)
      //}else{
        //TODO: check_view_state_url_start에 대응시켜야하는 페이지
      //}

      let video_state_map_by_title = {}
      for (let video_state of video_state_list) {
        if (!video_state_map_by_title[video_state.title])
          video_state_map_by_title[video_state.title] = []

        video_state_map_by_title[video_state.title].push(video_state)
      }


      $(() => {
        let current_week = $('.course-box-current')
        let old_id = null
        let current_week_video_array = null

        Array.from($('#course-all-sections').find('img[alt=동영상]')).map(e => ({
          element: e.parentElement,
          title: normalize_title(e.parentElement.children[1].innerText.split('\n')[0]),
          style: e.parentElement.style,
          week_id: e.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id
        })).forEach(video => {
          if (old_id != video.week_id) {
            current_week_video_array = Array.from(current_week.find('#' + video.week_id).find('img[alt=동영상]')).map(e => ({
              element: e.parentElement,
              title: normalize_title(e.parentElement.children[1].innerText.split('\n')[0]),
              style: e.parentElement.style,
              week_id: e.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id
            }))

            old_id = video.week_id
          }

          let obj_videos = [video]

          if (current_week_video_array.length && current_week_video_array[0].title == video.title) {
            obj_videos.push(current_week_video_array[0])
            current_week_video_array.shift()
          }


          let state = (video_state_map_by_title[video.title] || []).shift()

          if (state && (state.presence == 'O' || state.presence == 'X')) {

            obj_videos.forEach(video => {
              video.style.fontWeight = 'bold'

              if (state.presence == 'O')
                video.style.color = colors['출석']
              else
                video.style.color = colors['결석']

              if (video.element.classList.contains('dimmed_text')) {
                video.element.classList.remove('dimmed_text')
                video.element.children[0].style.opacity = '0.5'
              }
            })
          }
        })
      })
    })
  }

  const todo = document.createElement('ul');
  todo.className = 'weeks ubsweeks';
  todo.style.borderBottom = 0;
  todo.style.padding = '0rem 2rem';
  const todoContent = document.createElement('li')
  todoContent.className = 'section main clearfix'
  todoContent.style.paddingBottom = 0;
  todoContent.innerHTML = `<div class="content"><h3 class="sectionname"><span style="color:purple">TODO</span></h3><ul class="section img-text"></ul></div>`
  const todoTitle = todoContent.getElementsByClassName('sectionname')[0]
  const todoList = todoContent.getElementsByClassName('section')[0]
  todoList.style.display = 'none'
  todoTitle.addEventListener('click', () => {
    if(todoList.style.display === 'none')
      todoList.style.display = 'block';
    else
      todoList.style.display = 'none'
  })
  todo.append(todoContent)
  todo.style.display = 'none'
  document.getElementsByClassName('course-box')[0].append(todo);
  function addTODO(node){
    todoList.append(node.cloneNode(true));
    todo.style.display = 'block'
  }

  // 과제 하이라이트
  function highlight_assignments() {
    Array.from($('img[alt=과제]')).map(e => ({
      element: e.parentElement,
      href: e.parentElement.href,
      style: e.parentElement.style
    })).filter(assignment => assignment.href).forEach(assignment => {
      $.ajax({ url: assignment.href }).done(html => {
        let vdom = $.parseHTML(html)

        let status_table = $(vdom).find('.submissionstatustable')[0]
        let is_submitted = status_table.innerHTML.includes('제출 완료')

        assignment.style.fontWeight = 'bold'

        if (is_submitted)
          assignment.style.color = colors['과제-제출-완료']
        else{
          assignment.style.color = colors['과제-제출-안-함'];
          if(!html.includes('제출 마감이 지난 시간'))
            addTODO(get_child(assignment.element, -5))
        }

        let feedback = $(vdom).find('.feedback')[0]
        if (feedback) {
          let score = get_child(feedback, [1, 0, 0, 0, 1])
          let node = document.createElement('span')
          node.innerText = ' ' + score.innerText
          node.style.color = colors['과제-점수']
          assignment.element.appendChild(node)
        }
      })
    })

    Array.from($('img[alt="코딩 과제"]')).map(e => ({
      element: e.parentElement,
      href: e.parentElement.href,
      style: e.parentElement.style
    })).filter(assignment => assignment.href).reverse().forEach(assignment => {
      $.ajax({ url: assignment.href.replace('view', 'forms/submissionview') }).done(html => {
        let vdom = $($.parseHTML(html))
        const box = vdom.find('.box')[0]

        if(!box){
          assignment.style.color = colors['과제-제출-안-함']
          console.log(get_child(assignment.element, -6))
          if(vdom.find('li.nav-item-submission\\.php').length)
            addTODO(get_child(assignment.element, -5))
          return;
        }

        try{
          const score = $(box).find('b')[0].nextSibling.textContent.replace(': ', '')
          let node = document.createElement('span')
          node.innerText = ' ' + score
          assignment.element.appendChild(node)
          assignment.style.color = colors['과제-제출-완료']
        }catch(e) {
          console.error(e)
        }
      })
    })
  }

  const storage = chrome.storage.sync

  function highlight_files() {
    Array.from($('img[alt=파일]')).map(e => ({
      element: e.parentElement,
      href: e.parentElement.href,
      style: e.parentElement.style
    })).forEach(file => {
      if(view[file.href])
        file.style.color = colors['클릭-함']
      else
        file.style.color = colors['클릭-안-함']

      file.element.addEventListener('click', () => {
        if(!view[file.href]) {
          view[file.href] = true;
          storage.set({ view })
        }
      })
    })
  }

  function track_storage()
  {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if(changes['colors']){
        colors = changes['colors'].newValue;
        highlight_videos()
        highlight_assignments()
        highlight_files()
      }
      if(changes['view']){
        view = changes['view'].newValue;
        highlight_files()
      }
      if(changes['settings']){
        settings = changes['settings'].newValue;
        if(changes['settings'].oldValue.inlineVideo != changes['settings'].newValue.inlineVideo)
          inject_inline_video_feature(settings.inlineVideo)
      }
    });
  }

  function hide_inline_videos()
  {
    Array.from($('.inline-video')).forEach(video => {
      video.pause()
      video.style.display = "none"
    })
  }

  function handle_video(ev)
  {
    ev.stopPropagation()
    ev.preventDefault()
    
    const target = ev.target
    const href = target.parentNode.href
    let parent= target.parentNode
    while(!parent.className.includes("ubfile"))
      parent = parent.parentNode
    
    const id = "v" + parent.id
    
    let video = $("#" + id)[0]
    if(video){
      if(video.style.display == "none" || video.parentNode != parent.parentNode){
        hide_inline_videos()
        video.style.display = "block"
      }else
        video.style.display = "none"
    } else {
      hide_inline_videos()
      video = document.createElement("video")
      video.id = id;
      video.className = "inline-video"
      video.src = href;
      video.controls = true;
      video.style.width = "100%"
      video.style["max-width"] = "1080px"
    }
    
    parent.parentNode.insertBefore(video, parent.nextSibling);
  }

  const video_images = [
    "https://plato.pusan.ac.kr/theme/image.php/coursemosv2/core/1629360092/f/quicktime-24",
    "https://plato.pusan.ac.kr/theme/image.php/coursemosv2/core/1629360092/f/mpeg-24"
  ]

  function inject_inline_video_feature(flag = true) {
    Array.from($('img[alt=파일]'))
      .filter(img => video_images.includes(img.src))
      .map(v => v.parentNode)
      .forEach(a => a.onclick = flag ? handle_video : null)
  }
  
  storage.get(['colors', 'view', 'settings'], result => {
    colors = result.colors || {
      '출석': 'green',
      '결석': 'red',
      '과제-제출-완료': 'green',
      '과제-제출-안-함': 'red',
      '과제-점수': 'hotpink',
      '클릭-함': 'hotpink',
      '클릭-안-함': 'black'
    }

    view = result.view || {}
    settings = result.settings || {}

    $(highlight_videos)
    $(highlight_assignments)
    $(highlight_files)
    $(track_storage)

    if(settings.inlineVideo)
      inject_inline_video_feature()
  })
})()
