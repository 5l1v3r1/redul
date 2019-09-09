import { render, createElement as h, useState } from '../src'

const getRootNode = () => {
    document.body.innerHTML = '<div id="root"></div>'
    const $root = document.getElementById('root')
    return $root
}
const $root = getRootNode()

describe('fiber reconcile test', () => {
    describe('mount stage', () => {
        test('element string type', () => {

            render(<div className="test" style={{color: 'red'}}></div>, $root)
            expect($root).toMatchSnapshot()
        })

        test('element function type', () => {
            function Count({ count }) {
                return <div>{count}</div>
            }

            render(<Count count={1} />, $root)
            expect($root).toMatchSnapshot()
        })

        test('element complex function type', () => {
            function App() {
                return <div><Count count={1} /></div>
            }

            function Count({ count }) {
                return <span>{count}</span>
            }

            render(<App />, $root)
            expect($root).toMatchSnapshot()
        })
    })
})

describe('fiber hook test', () => {
    describe('useState', () => {
        test('init value', () => {
            function Count({ count }) {
                const [value] = useState(count)
                return <div>{value}</div>
            }

            render(<Count count={1} />, $root)
            expect($root).toMatchSnapshot()
        })

        test('dispatch with click event', () => {
            function Count({ count }) {
                const [value, setValue] = useState(count)

                return <div id="counter" onClick={() => setValue(count + 1)}>{value}</div>
            }

            render(<Count count={1} />, $root)
            const $counter = document.getElementById('counter')
            $counter.click()
            expect($root).toMatchSnapshot()
        })
    })
})
