(function () {
  console.log("PLATO Highlighter enabled. ")
  const current_url = window.location.href
  const domain = current_url.split('/').slice(0, 3).join('/')
  const course_view_url_start = `${domain}/course/view.php?id=`
  const check_view_state_url_start = `${domain}/report/ubcompletion/user_progress_a.php?id=`
  const course_id = +current_url.substr(course_view_url_start.length)

  function normalize_title(title) {
    return title.replace(/ /g, '')
  }

  function get_child(element, index) {
    if (!Array.isArray(index))
      return get_child(element, [index])

    for (let i of index)
      element = element.children[i]

    return element
  }

  // 녹강 하이라이트
  function highlight_videos() {
    if (!isFinite(course_id) || isNaN(course_id))
      throw Error('course_id is NaN')

    $.ajax({ url: check_view_state_url_start + course_id }).done(html => {
      let vdom = $.parseHTML(html)

      let video_state_list = Array.from($(vdom).find('.user_progress_table')[0].children[2].children).map(e => ({
        title: normalize_title(e.children[+(e.children.length == 6)].textContent),
        presence: e.children[3 + (e.children.length == 6)].innerText
      })).filter(video => video.title)

      let video_state_map_by_title = {}
      for (let video_state of video_state_list)
        video_state_map_by_title[video_state.title] = video_state

      $(() => {
        Array.from($('img[alt=동영상]')).map(e => ({
          element: e.parentElement,
          title: normalize_title(e.parentElement.children[1].innerText.split('\n')[0]),
          style: e.parentElement.style
        })).forEach(video => {
          let state = video_state_map_by_title[video.title]
          if (state && (state.presence == 'O' || state.presence == 'X')) {

            video.style['font-weight'] = 'bold'

            if (state.presence == 'O')
              video.style['color'] = 'green'
            else
              video.style['color'] = 'red'

            if (video.element.className.includes('dimmed')) {
              video.element.className = ''
              video.element.children[0].style['opacity'] = '0.5'
            }
          }
        })
      })
    })
  }

  // 과제 하이라이트
  function highlight_assignments() {
    Array.from($('img[alt=과제]')).map(e => ({
      element: e.parentElement,
      href: e.parentElement.href,
      style: e.parentElement.style
    })).forEach(assignment => {
      $.ajax({ url: assignment.href }).done(html => {
        let vdom = $.parseHTML(html)

        let status_table = $(vdom).find('.submissionstatustable')[0]
        let is_submitted = (get_child(status_table, [1, 0, 0, 0, 1]).innerText == '제출 완료')

        assignment.style['font-weight'] = 'bold'

        if (is_submitted)
          assignment.style['color'] = 'green'
        else
          assignment.style['color'] = 'red'

        let feedback = $(vdom).find('.feedback')[0]
        if (feedback) {
          let score = get_child(feedback, [1, 0, 0, 0, 1])
          let node = document.createElement('span')
          node.innerText = ' ' + score.innerText
          assignment.element.appendChild(node)
        }
      })
    })
  }

  $(highlight_videos)
  $(highlight_assignments)
})()