import React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash';
import TranslatedComponent from './TranslatedComponent';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import cn from 'classnames';
import Modification from './Modification';
import {
  blueprintTooltip,
  specialToolTip
} from '../utils/BlueprintFunctions';
import { getBlueprintInfo, getExperimentalInfo } from 'ed-forge/lib/data/blueprints';
import { getModuleInfo } from 'ed-forge/lib/data/items';

/**
 * Modifications menu
 */
export default class ModificationsMenu extends TranslatedComponent {
  static propTypes = {
    className: PropTypes.string,
    m: PropTypes.object.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this._toggleBlueprintsMenu = this._toggleBlueprintsMenu.bind(this);
    this._toggleSpecialsMenu = this._toggleSpecialsMenu.bind(this);
    this.selectedModRef = null;
    this.selectedSpecialRef = null;

    const { m } = props;
    this.state = {
      blueprintMenuOpened: !m.getBlueprint(),
      specialMenuOpened: false
    };
  }

  /**
   * Render the blueprints
   * @return {Object}         list: Array of React Components
   */
  _renderBlueprints() {
    const { m } = this.props;
    const { language, tooltip, termtip } = this.context;
    const { translate } = language;

    const blueprints = [];
    for (const blueprint of m.getApplicableBlueprints()) {
      const info = getBlueprintInfo(blueprint);
      let blueprintGrades = [];
      for (let grade in info.features) {
        // Grade is a string in the JSON so make it a number
        grade = Number(grade);
        const active = m.getBlueprint() === blueprint && m.getBlueprintGrade() === grade;
        const key = blueprint + ':' + grade;
        // const tooltipContent = blueprintTooltip(translate, info.features[grade]);
        blueprintGrades.unshift(
          <li key={key} data-id={key} className={cn('c', { active })}
            style={{ width: '2em' }}
            // onMouseOver={termtip.bind(null, tooltipContent)}
            // onMouseOut={tooltip.bind(null, null)}
            onClick={() => {
              m.setBlueprint(blueprint, grade, 1);
              this.setState({
                blueprintMenuOpened: false,
                specialMenuOpened: true,
              });
            }}
            ref={active ? (ref) => { this.selectedModRef = ref; } : undefined}
          >{grade}</li>
        );
      }

      blueprints.push(
        [
          <div key={'div' + blueprint} className={'select-group cap'}>
            {translate(blueprint)}
          </div>,
          <ul key={'ul' + blueprint}>{blueprintGrades}</ul>
        ],
      );
    }

    return [].concat(...blueprints);
  }

  /**
   * Render the specials
   * @param  {Object} props   React component properties
   * @param  {Object} context React component context
   * @return {Object}         list: Array of React Components
   */
  _renderSpecials() {
    const { m } = this.props;
    const { language, tooltip, termtip } = this.context;
    const translate = language.translate;

    const applied = m.getExperimental();
    const experimentals = [];
    for (const experimental of m.getApplicableExperimentals()) {
      const active = experimental === applied;
      // TODO:
      // let specialTt = specialToolTip(
      //   translate,
      //   m.blueprint.grades[m.blueprint.grade],
      //   m.grp, m,
      //   experimental,
      // );
      experimentals.push(
        <div key={experimental} data-id={experimental}
          style={{ cursor: 'pointer' }}
          className={cn('button-inline-menu', { active })}
          onClick={this._specialSelected(experimental)}
          ref={active ? (ref) => { this.selectedSpecialRef = ref; } : undefined}
          // onMouseOver={termtip.bind(null, specialTt)}
          // onMouseOut={tooltip.bind(null, null)}
        >{translate(experimental)}</div>
      );
    }

    if (experimentals.length) {
      experimentals.unshift(
        <div style={{ cursor: 'pointer', fontWeight: 'bold' }}
          className="button-inline-menu warning" key="none" data-id="none"
          // Setting the special effect to undefined clears it
          onClick={this._specialSelected(undefined)}
          ref={!applied ? (ref) => { this.selectedSpecialRef = ref; } : undefined}
        >{translate('PHRASE_NO_SPECIAL')}</div>
      );
    }

    return experimentals;
  }

  /**
   * Create a modification component
   */
  _mkModification(property, highlight) {
    const { m } = this.props;
    return <Modification key={property} highlight={highlight} m={m}
      property={property} value={m.get(property)} />;
  }

  /**
   * Render the modifications
   * @param  {Object} props   React Component properties
   * @return {Array}          Array of React Components
   */
  _renderModifications(props) {
    const { m } = props;

    const blueprintFeatures = getBlueprintInfo(m.getBlueprint()).features[
      m.getBlueprintGrade()
    ];
    const blueprintModifications = Object.keys(blueprintFeatures)
      .map((feature) => this._mkModification(feature, true))
      .filter(Boolean);
    const moduleModifications = Object.keys(getModuleInfo(m.getItem()).props)
      .filter((prop) => !blueprintFeatures[prop])
      .map((prop) => this._mkModification(prop, false));

    return blueprintModifications.concat(moduleModifications);
  }

  /**
   * Toggle the blueprints menu
   */
  _toggleBlueprintsMenu() {
    this.setState({ blueprintMenuOpened: !this.state.blueprintMenuOpened });
  }

  /**
   * Toggle the specials menu
   */
  _toggleSpecialsMenu() {
    this.setState({ specialMenuOpened: !this.state.specialMenuOpened });
  }

  /**
   * Creates a callback for when a special effect is being selected
   * @param   {string} special The name of the selected special
   * @returns {function} Callback
   */
  _specialSelected(special) {
    return () => {
      const { m } = this.props;
      m.setExperimental(special);
      this.setState({ specialMenuOpened: false });
    };
  }

  /**
   * Set focus on first element in modifications menu
   * if component updates, unless update is due to value change
   * in a modification
   */
  componentDidUpdate() {
    if (this.selectedModRef) {
      this.selectedModRef.focus();
      return;
    } else if (this.selectedSpecialRef) {
      this.selectedSpecialRef.focus();
      return;
    }
  }

  /**
   * Render the list
   * @return {React.Component} List
   */
  render() {
    const { language, tooltip, termtip } = this.context;
    const translate = language.translate;
    const { m } = this.props;
    const { blueprintMenuOpened, specialMenuOpened } = this.state;

    const appliedBlueprint = m.getBlueprint();
    const appliedExperimental = m.getExperimental();
    const blueprintProgress = m.getBlueprintProgress();

    let renderComponents = [];
    switch (true) {
      case !appliedBlueprint || blueprintMenuOpened:
        renderComponents = this._renderBlueprints();
        break;
      case specialMenuOpened:
        renderComponents = this._renderSpecials();
        break;
      default:
        // Since the first case didn't apply, there is a blueprint applied so
        // we render the modifications
        // let blueprintTt  = blueprintTooltip(translate, m.blueprint.grades[m.blueprint.grade]);

        renderComponents.push(
          <div style={{ cursor: 'pointer' }} key="blueprintsMenu"
            className="section-menu button-inline-menu"
            // onMouseOver={termtip.bind(null, blueprintTt)}
            // onMouseOut={tooltip.bind(null, null)}
            onClick={this._toggleBlueprintsMenu}
          >
            {translate(appliedBlueprint)} {translate('grade')} {m.getBlueprintGrade()}
          </div>
        );

        if (m.getApplicableExperimentals().length) {
          let specialLabel = translate('PHRASE_SELECT_SPECIAL');
          let specialTt;
          if (appliedExperimental) {
            specialLabel = appliedExperimental;
            // specialTt = specialToolTip(translate, m.blueprint.grades[m.blueprint.grade], m.grp, m, m.blueprint.special.edname);
          }
          renderComponents.push(
            <div className="section-menu button-inline-menu"
              style={{ cursor: 'pointer' }}
              onMouseOver={specialTt ? termtip.bind(null, specialTt) : null}
              onMouseOut={specialTt ? tooltip.bind(null, null) : null}
              onClick={this._toggleSpecialsMenu}
            >{specialLabel}</div>
          );
        }

        renderComponents.push(
          <div
            className="section-menu button-inline-menu warning"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              m.resetEngineering();
              this.selectedModRef = null;
              this.selectedSpecialRef = null;
              tooltip(null);
              this.setState({ blueprintMenuOpened: true });
            }}
            onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RESET')}
            onMouseOut={tooltip.bind(null, null)}
          >{translate('reset')}</div>,
          <table style={{ width: '100%', backgroundColor: 'transparent' }}>
            <tbody>
              <tr>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: false },
                  )}
                >{translate('mroll')}:</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress === 0 },
                  )} style={{ cursor: 'pointer' }}
                  onClick={() => m.setBlueprintProgress(0)}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_WORST')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('0%')}</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress === 0.5 },
                  )} style={{ cursor: 'pointer' }}
                  onClick={() => m.setBlueprintProgress(0.5)}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_FIFTY')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('50%')}</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress === 1 },
                  )}
                  style={{ cursor: 'pointer' }}
                  onClick={() => m.setBlueprintProgress(1)}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_BEST')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('100%')}</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress % 0.5 !== 0 },
                  )}
                  style={{ cursor: 'pointer' }}
                  onClick={() => m.setBlueprintProgress(Math.random())}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RANDOM')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('random')}</td>
              </tr>
            </tbody>
          </table>,
          <hr />,
          <span
            onMouseOver={termtip.bind(null, 'HELP_MODIFICATIONS_MENU')}
            onMouseOut={tooltip.bind(null, null)}
          >{this._renderModifications(this.props)}</span>
        );
    }

    return (
      <div className={cn('select', this.props.className)}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={stopCtxPropagation}
      >
        {renderComponents}
      </div>
    );
  }
}
