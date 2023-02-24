window.addEventListener("load", () => {
    const storage = chrome.storage.sync
    storage.get(['colors', 'settings'], result => {
        colors = result.colors || {
            '출석': 'green',
            '결석': 'red',
            '과제-제출-완료': 'green',
            '과제-제출-안-함': 'red',
            '과제-점수': 'hotpink',
            '클릭-함': 'green',
            '클릭-안-함': 'red'
        }

        function $(query)
        {
            return Array.from(document.querySelectorAll(query))
        }

        $('input[type="color"]')
            .forEach(input => {
                input.onchange = () => {
                    colors[input.id] = input.value;
                    storage.set({ colors })
                    input.parentElement.style.color = input.value;
                }

                input.value = colors[input.id]
                input.parentElement.style.color = colors[input.id]
            });

        $('.과제-점수-입력').forEach(input => {
            input.onchange = () => {
                colors['과제-점수'] = input.value

                storage.set({ colors })

                $('.과제-점수').forEach(label => {
                    label.style.color = input.value
                })

                $('.과제-점수-입력').forEach(oth => {
                    if(input.value !== oth.value)
                        oth.value = input.value;
                })
            }

            input.value = colors['과제-점수']
        })

        const settings = result.settings || {}
        const inlineVideoFlagInput = $('#inline-video')[0]
        inlineVideoFlagInput.checked = settings.inlineVideo
        inlineVideoFlagInput.onchange = () => {
            settings.inlineVideo = inlineVideoFlagInput.checked
            storage.set({ settings })
        }
    })
})
