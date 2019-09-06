import { render, createElement as h } from '../src'

const getRootNode = () => {
    document.body.innerHTML = '<div id="root"></div>'
    const $root = document.getElementById('root')
    return $root
}
const $root = getRootNode()

describe('fiber reconcile test', () => {
    describe('mount stage', () => {
        test('element string type', () => {

            expect(render(<div className="test"></div>, $root)).toMatchSnapshot()
        })

        test('element function type', () => {
            function Count({ count }) {
                return <div>{count}</div>
            }
            expect(render(<Count count={1} />, $root)).toMatchSnapshot()
        })
    })
})
